import { getCorsHeaders } from '../utils/response.js';

/**
 * Trích xuất an toàn đoạn text delta từ mọi biến thể định dạng chunk
 * (OpenAI-compatible chat completion chunk, Cloudflare legacy response, v.v.)
 */
function extractDeltaText(parsed: any): string {
  if (!parsed || typeof parsed !== 'object') {
    return typeof parsed === 'string' ? parsed : '';
  }

  // 1. Định dạng OpenAI Chat Completion chunk: choices[0].delta.content (Định dạng chính của Cloudflare Workers AI)
  if (parsed.choices && Array.isArray(parsed.choices) && parsed.choices.length > 0) {
    const choice = parsed.choices[0];
    if (choice?.delta?.content && typeof choice.delta.content === 'string') {
      return choice.delta.content;
    }
    if (choice?.text && typeof choice.text === 'string') {
      return choice.text;
    }
    if (typeof choice?.delta === 'string') {
      return choice.delta;
    }
  }

  // 2. Định dạng Cloudflare Workers AI legacy: response
  if (typeof parsed.response === 'string' && parsed.response.length > 0) {
    return parsed.response;
  }

  // 3. Định dạng delta.content
  if (parsed.delta && typeof parsed.delta.content === 'string') {
    return parsed.delta.content;
  }

  // 4. Định dạng direct content
  if (typeof parsed.content === 'string') {
    return parsed.content;
  }

  return '';
}

export function createSseResponseStream(
  upstreamStream: ReadableStream,
  requestId: string,
  model: string
): Response {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder('utf-8');

  let buffer = '';
  let emittedDeltas = 0;

  const transformStream = new TransformStream({
    start(controller) {
      console.log(`[StreamAdapter:${requestId}] Bắt đầu SSE stream, gửi meta event...`);
      // Gửi event meta đầu tiên
      const metaEvent = `event: meta\ndata: ${JSON.stringify({ requestId, model })}\n\n`;
      controller.enqueue(encoder.encode(metaEvent));
    },

    transform(chunk, controller) {
      const rawText = decoder.decode(chunk, { stream: true });
      buffer += rawText;

      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed.startsWith('data:')) {
          const jsonStr = trimmed.slice(5).trim();
          if (jsonStr === '[DONE]') {
            console.log(`[StreamAdapter:${requestId}] Nhận tín hiệu [DONE] từ upstream.`);
            continue;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const textDelta = extractDeltaText(parsed);
            if (textDelta) {
              emittedDeltas++;
              const deltaEvent = `event: delta\ndata: ${JSON.stringify({ text: textDelta })}\n\n`;
              controller.enqueue(encoder.encode(deltaEvent));
            }
          } catch {
            if (jsonStr) {
              emittedDeltas++;
              const deltaEvent = `event: delta\ndata: ${JSON.stringify({ text: jsonStr })}\n\n`;
              controller.enqueue(encoder.encode(deltaEvent));
            }
          }
        } else {
          // Trường hợp upstream không có tiền tố data:
          try {
            const parsed = JSON.parse(trimmed);
            const textDelta = extractDeltaText(parsed);
            if (textDelta) {
              emittedDeltas++;
              const deltaEvent = `event: delta\ndata: ${JSON.stringify({ text: textDelta })}\n\n`;
              controller.enqueue(encoder.encode(deltaEvent));
            }
          } catch {}
        }
      }
    },

    flush(controller) {
      console.log(`[StreamAdapter:${requestId}] Flush stream. Tổng số delta đã emit: ${emittedDeltas}`);
      // Xử lý nốt buffer còn lại nếu có
      if (buffer.trim().startsWith('data:')) {
        const jsonStr = buffer.trim().slice(5).trim();
        if (jsonStr && jsonStr !== '[DONE]') {
          try {
            const parsed = JSON.parse(jsonStr);
            const textDelta = extractDeltaText(parsed);
            if (textDelta) {
              controller.enqueue(encoder.encode(`event: delta\ndata: ${JSON.stringify({ text: textDelta })}\n\n`));
            }
          } catch {}
        }
      }

      // Gửi event usage
      const usageEvent = `event: usage\ndata: ${JSON.stringify({ inputTokens: null, outputTokens: null, neurons: null })}\n\n`;
      controller.enqueue(encoder.encode(usageEvent));

      // Gửi event done
      const doneEvent = `event: done\ndata: ${JSON.stringify({ requestId })}\n\n`;
      controller.enqueue(encoder.encode(doneEvent));
    }
  });

  const readable = upstreamStream.pipeThrough(transformStream);

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
      'X-Request-ID': requestId,
      ...getCorsHeaders()
    }
  });
}
