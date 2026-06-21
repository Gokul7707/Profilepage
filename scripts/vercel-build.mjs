import { cpSync, mkdirSync, rmSync } from 'node:fs';

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });

for (const target of ['hello.html', 'index.html', '.nojekyll']) {
  cpSync(target, `dist/${target}`);
}

for (const dir of ['assets', 'resume']) {
  cpSync(dir, `dist/${dir}`, { recursive: true });
}

console.log('Static portfolio copied to dist/');
