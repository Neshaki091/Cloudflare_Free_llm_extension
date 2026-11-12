import { execSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// Tìm esbuild trong npm-cache hoặc môi trường
let esbuildBin = 'esbuild';

const npmCacheBase = join(process.env.LOCALAPPDATA || '', 'npm-cache', '_npx');
if (existsSync(npmCacheBase)) {
  const dirs = readdirSync(npmCacheBase);
  for (const d of dirs) {
    const candidate = join(npmCacheBase, d, 'node_modules', 'esbuild', 'bin', 'esbuild');
    if (existsSync(candidate)) {
      esbuildBin = `node "${candidate}"`;
      break;
    }
  }
}

console.log('[NesCode] Bắt đầu build Extension bundle qua esbuild...');
const cmd = `${esbuildBin} src/extension/src/extension.ts --bundle --platform=node --target=node20 --external:vscode --format=cjs --outfile=src/extension/extension.js`;
execSync(cmd, { stdio: 'inherit' });
console.log('[NesCode] Biên dịch Extension thành công -> src/extension/extension.js');

