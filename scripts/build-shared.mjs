import { execSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

let esbuildBin = 'esbuild';
const npmCacheBase = join(process.env.LOCALAPPDATA || '', 'npm-cache', '_npx');
if (existsSync(npmCacheBase)) {
  for (const d of readdirSync(npmCacheBase)) {
    const candidate = join(npmCacheBase, d, 'node_modules', 'esbuild', 'bin', 'esbuild');
    if (existsSync(candidate)) {
      esbuildBin = `node "${candidate}"`;
      break;
    }
  }
}

execSync(`${esbuildBin} src/shared/src/index.ts --bundle --platform=node --format=esm --outfile=src/shared/dist/index.js`, { stdio: 'inherit' });
console.log('[NesCode] Đã biên dịch shared -> src/shared/dist/index.js');
