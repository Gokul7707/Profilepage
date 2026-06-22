import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const WEB3FORMS_ACCESS_KEY = process.env.WEB3FORMS_ACCESS_KEY || '120a3271-7ed1-4627-a41b-c71a66fcb011';
const FORMSUBMIT_TOKEN = process.env.FORMSUBMIT_TOKEN || '';

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });

function injectContactConfig(html) {
  return html
    .replaceAll('__WEB3FORMS_ACCESS_KEY__', WEB3FORMS_ACCESS_KEY)
    .replaceAll('__FORMSUBMIT_TOKEN__', FORMSUBMIT_TOKEN);
}

for (const target of ['hello.html', 'index.html', '.nojekyll']) {
  if (target.endsWith('.html')) {
    const html = readFileSync(target, 'utf8');
    writeFileSync(`dist/${target}`, injectContactConfig(html));
  } else {
    cpSync(target, `dist/${target}`);
  }
}

for (const dir of ['assets', 'resume']) {
  cpSync(dir, `dist/${dir}`, { recursive: true });
}

if (!WEB3FORMS_ACCESS_KEY && !FORMSUBMIT_TOKEN) {
  console.warn(
    'Warning: set WEB3FORMS_ACCESS_KEY (recommended) or FORMSUBMIT_TOKEN in Vercel env vars so the contact form can send email.'
  );
} else {
  console.log('Contact form config injected for production build.');
}

console.log('Static portfolio copied to dist/');
