import test from 'node:test';
import assert from 'node:assert/strict';

test('SseParser - Handles full SSE stream cycle', async () => {
  const { SseParser } = await import('../src/extension/src/api/sseParser.ts');

  const receivedMeta = [];
  const receivedDeltas = [];
  const receivedDone = [];

  const parser = new SseParser({
    onMeta: (data) => receivedMeta.push(data),
    onDelta: (data) => receivedDeltas.push(data.text),
    onDone: (data) => receivedDone.push(data)
  });

  parser.feed('event: meta\ndata: {"requestId":"req-123","model":"@cf/zai-org/glm-4.7-flash"}\n\n');
  parser.feed('event: delta\ndata: {"text":"Xin chào"}\n\n');
  parser.feed('event: delta\ndata: {"text":" thế giới!"}\n\n');
  parser.feed('event: done\ndata: {"requestId":"req-123"}\n\n');
  parser.end();

  assert.equal(receivedMeta.length, 1);
  assert.equal(receivedMeta[0].requestId, 'req-123');
  assert.equal(receivedDeltas.join(''), 'Xin chào thế giới!');
  assert.equal(receivedDone.length, 1);
  assert.equal(receivedDone[0].requestId, 'req-123');
});

test('SseParser - Handles fragmented chunks and CRLF endings', async () => {
  const { SseParser } = await import('../src/extension/src/api/sseParser.ts');

  const receivedDeltas = [];

  const parser = new SseParser({
    onDelta: (data) => receivedDeltas.push(data.text)
  });

  // Gửi chunk bị cắt vụn thành từng phần nhỏ
  parser.feed('event: delta\r\nda');
  parser.feed('ta: {"text":"Hàm kiểm tra"}');
  parser.feed('\r\n\r\nevent: delta\r\ndata: {"text":" số nguyên tố"}\r\n\r\n');
  parser.end();

  assert.equal(receivedDeltas.join(''), 'Hàm kiểm tra số nguyên tố');
});
