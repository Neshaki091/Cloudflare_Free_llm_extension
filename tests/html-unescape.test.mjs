import test from 'node:test';
import assert from 'node:assert/strict';

// Mô phỏng logic unescapeHtml trong Webview client
function unescapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

test('HTML Unescaping - Restores comparison and logic operators in Python/TypeScript code', () => {
  const escapedPython = 'if n &lt;= 1:\n    return False\nif n &gt; 2 and n &lt; 10:\n    return True';
  const restored = unescapeHtml(escapedPython);

  assert.equal(restored, 'if n <= 1:\n    return False\nif n > 2 and n < 10:\n    return True');
});

test('HTML Unescaping - Restores quotes and ampersands in strings and shell commands', () => {
  const escapedShell = 'echo &quot;Hello &amp; Welcome&quot; &gt;&gt; log.txt &amp;&amp; cat log.txt';
  const restored = unescapeHtml(escapedShell);

  assert.equal(restored, 'echo "Hello & Welcome" >> log.txt && cat log.txt');
});

test('HTML Unescaping - Handles single quotes and edge cases safely', () => {
  assert.equal(unescapeHtml('it&#39;s fine'), "it's fine");
  assert.equal(unescapeHtml(''), '');
  assert.equal(unescapeHtml(null), '');
  assert.equal(unescapeHtml(undefined), '');
});
