import test from 'node:test';
import assert from 'node:assert/strict';
import { compressFileContent, compressContextFiles } from '../src/extension/src/context/contextCompressor.ts';

test('Context Compressor - Collapses consecutive empty lines and strips trailing spaces', () => {
  const messyCode = `
def foo():   
    print("line 1")   



    print("line 2")


foo()
  `;

  const compressed = compressFileContent(messyCode, 2000, 'python');
  assert.ok(!compressed.includes('\n\n\n'), 'Không được chứa nhiều hơn 2 dòng trống liên tiếp');
  assert.ok(compressed.includes('def foo():\n    print("line 1")\n\n    print("line 2")\n\nfoo()'));
});

test('Context Compressor - Cleanly truncates content at line boundaries with notice', () => {
  const longText = Array.from({ length: 20 }, (_, i) => `line_${i + 1} = ${i + 1}`).join('\n');
  const compressed = compressFileContent(longText, 60, 'python');

  assert.ok(compressed.length <= 150);
  assert.ok(compressed.includes('# ... [Đã nén và rút gọn phần còn lại'));
  // Đảm bảo không cắt ngang giữa 1 từ
  assert.match(compressed, /line_\d+ = \d+/);
});

test('Context Compressor - Distributes budget across multiple context files', () => {
  const files = [
    { path: 'app.py', language: 'python', content: 'x = 1\n'.repeat(500) },
    { path: 'utils.py', language: 'python', content: 'y = 2\n'.repeat(500) },
    { path: 'README.md', language: 'markdown', content: '# Readme\n'.repeat(500) }
  ];

  const compressed = compressContextFiles(files, 6000);
  assert.equal(compressed.length, 3);

  let totalChars = 0;
  for (const f of compressed) {
    totalChars += f.content.length;
  }

  assert.ok(totalChars <= 6500, `Tổng dung lượng ${totalChars} phải xấp xỉ ngân sách 6000`);
});
