import { getCorsHeaders } from '../utils/response.js';

export function createSseResponseStream(
  upstreamStream: ReadableStream,
  requestId: string,
  model: string
): Response {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder('utf-8');

  let buffer = '';

  const transformStream = new TransformStream({
    start(controller) {
      // Gửi event meta đầu tiên
      const metaEvent = `event: meta\ndata: ${JSON.stringify({ requestId, model })}\n\n`;
      controller.enqueue(encoder.encode(metaEvent));
    },

    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed.startsWith('data:')) {
          const jsonStr = trimmed.slice(5).trim();
          if (jsonStr === '[DONE]') {
            continue;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            // Cloudflare Workers AI trả về text trong field 'response' hoặc 'delta.content'
            const textDelta = parsed.response || parsed.delta?.content || (typeof parsed === 'string' ? parsed : '');
            if (textDelta) {
              const deltaEvent = `event: delta\ndata: ${JSON.stringify({ text: textDelta })}\n\n`;
              controller.enqueue(encoder.encode(deltaEvent));
            }
          } catch {
            // Nếu không phải JSON, gửi thô nếu có nội dung
            if (jsonStr) {
              const deltaEvent = `event: delta\ndata: ${JSON.stringify({ text: jsonStr })}\n\n`;
              controller.enqueue(encoder.encode(deltaEvent));
            }
          }
        }
      }
    },

    flush(controller) {
      // Xử lý nốt buffer còn lại nếu có
      if (buffer.trim().startsWith('data:')) {
        const jsonStr = buffer.trim().slice(5).trim();
        if (jsonStr && jsonStr !== '[DONE]') {
          try {
            const parsed = JSON.parse(jsonStr);
            const textDelta = parsed.response || parsed.delta?.content || '';
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
