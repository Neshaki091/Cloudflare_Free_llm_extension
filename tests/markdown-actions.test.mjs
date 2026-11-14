import test from 'node:test';
import assert from 'node:assert/strict';

// Mô phỏng parser trích xuất action từ phản hồi của LLM
function extractAgentActions(rawText) {
  const writeFiles = [];
  const runCommands = [];

  const writeFileRegex = /<action\s+type="write_file"\s+path="([^"]+)">([\s\S]*?)<\/action>/gi;
  let match;
  while ((match = writeFileRegex.exec(rawText)) !== null) {
    writeFiles.push({
      path: match[1].trim(),
      content: match[2].trim()
    });
  }

  const runCmdRegex = /<action\s+type="run_command">([\s\S]*?)<\/action>/gi;
  while ((match = runCmdRegex.exec(rawText)) !== null) {
    runCommands.push({
      command: match[1].trim()
    });
  }

  return { writeFiles, runCommands };
}

test('Action Parser - Successfully extracts write_file actions', () => {
  const llmResponse = `
Dưới đây là mã nguồn tìm số nguyên tố:

<action type="write_file" path="find_primes.py">
import math

def is_prime(n):
    return n > 1
</action>

Bạn có thể chạy kiểm tra.
  `;

  const { writeFiles } = extractAgentActions(llmResponse);
  assert.equal(writeFiles.length, 1);
  assert.equal(writeFiles[0].path, 'find_primes.py');
  assert.match(writeFiles[0].content, /def is_prime\(n\):/);
});

test('Action Parser - Successfully extracts run_command actions', () => {
  const llmResponse = `
Để chạy bài kiểm tra, hãy thực thi lệnh sau:

<action type="run_command">
python -m unittest tests/test_primes.py
</action>
  `;

  const { runCommands } = extractAgentActions(llmResponse);
  assert.equal(runCommands.length, 1);
  assert.equal(runCommands[0].command, 'python -m unittest tests/test_primes.py');
});

test('Action Parser - Handles multiple mixed actions seamlessly', () => {
  const llmResponse = `
<action type="write_file" path="config.json">
{ "debug": true }
</action>

<action type="run_command">
npm test
</action>
  `;

  const { writeFiles, runCommands } = extractAgentActions(llmResponse);
  assert.equal(writeFiles.length, 1);
  assert.equal(runCommands.length, 1);
  assert.equal(writeFiles[0].path, 'config.json');
  assert.equal(runCommands[0].command, 'npm test');
});
