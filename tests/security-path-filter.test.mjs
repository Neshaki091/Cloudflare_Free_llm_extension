import test from 'node:test';
import assert from 'node:assert/strict';
import { isExcludedPath, sanitizeRelativePath } from '../src/shared/dist/index.js';

test('Security Filter - Correctly blocks sensitive files and secret directories', () => {
  // File nhạy cảm / bí mật
  assert.equal(isExcludedPath('.env', '.env'), true);
  assert.equal(isExcludedPath('.env.local', '.env.local'), true);
  assert.equal(isExcludedPath('.env.production', 'config/.env.production'), true);
  assert.equal(isExcludedPath('id_rsa.key', 'certs/id_rsa.key'), true);
  assert.equal(isExcludedPath('cert.pem', 'cert.pem'), true);
  assert.equal(isExcludedPath('gcp-credentials.json', 'secrets/gcp-credentials.json'), true);
  assert.equal(isExcludedPath('app_secret.txt', 'config/app_secret.txt'), true);

  // Thư mục cấm tuyệt đối
  assert.equal(isExcludedPath('node_modules', 'node_modules'), true);
  assert.equal(isExcludedPath('index.js', 'node_modules/lodash/index.js'), true);
  assert.equal(isExcludedPath('.git', '.git'), true);
  assert.equal(isExcludedPath('HEAD', '.git/HEAD'), true);
  assert.equal(isExcludedPath('dist', 'dist'), true);
  assert.equal(isExcludedPath('bundle.js', 'dist/bundle.js'), true);
  assert.equal(isExcludedPath('build', 'build'), true);
  assert.equal(isExcludedPath('.venv', '.venv'), true);
  assert.equal(isExcludedPath('cache.pyc', 'src/__pycache__/cache.pyc'), true);

  // File an toàn hợp lệ
  assert.equal(isExcludedPath('find_primes.py', 'find_primes.py'), false);
  assert.equal(isExcludedPath('index.ts', 'src/extension/src/index.ts'), false);
  assert.equal(isExcludedPath('package.json', 'package.json'), false);
  assert.equal(isExcludedPath('README.md', 'README.md'), false);
  assert.equal(isExcludedPath('TASK_BOARD.md', 'journal/tasks/TASK_BOARD.md'), false);
});

test('Path Traversal Protection - Rejects unsafe paths with parent traversal', () => {
  assert.equal(sanitizeRelativePath('../secret.txt'), null);
  assert.equal(sanitizeRelativePath('../../etc/passwd'), null);
  assert.equal(sanitizeRelativePath('src/../../passwords.txt'), null);
  assert.equal(sanitizeRelativePath('./../something'), null);
  assert.equal(sanitizeRelativePath(''), null);
  assert.equal(sanitizeRelativePath('   '), null);
  assert.equal(sanitizeRelativePath(null), null);
  assert.equal(sanitizeRelativePath(undefined), null);
});

test('Path Traversal Protection - Sanitizes valid relative paths cleanly', () => {
  assert.equal(sanitizeRelativePath('src\\extension\\src\\index.ts'), 'src/extension/src/index.ts');
  assert.equal(sanitizeRelativePath('/src/shared/index.ts'), 'src/shared/index.ts');
  assert.equal(sanitizeRelativePath('find_primes.py'), 'find_primes.py');
  assert.equal(sanitizeRelativePath('journal/tasks/TASK_BOARD.md'), 'journal/tasks/TASK_BOARD.md');
});

