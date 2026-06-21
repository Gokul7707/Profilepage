import { spawn, execSync } from 'node:child_process';
import { networkInterfaces } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import qrcode from 'qrcode-terminal';

const PORT = 8080;
const API_PORT = 8000;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const viteBin = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');

function freeDevPorts() {
  if (process.platform !== 'win32') return;
  try {
    execSync(
      'powershell -NoProfile -ExecutionPolicy Bypass -File scripts/kill-ports.ps1',
      { cwd: root, stdio: 'inherit' },
    );
  } catch {
    console.warn('\n  Could not auto-free ports. Run: pnpm run dev:clean\n');
  }
}

function getNetworkAddresses() {
  const nets = networkInterfaces();
  const addresses = [];

  for (const [, iface] of Object.entries(nets)) {
    for (const net of iface ?? []) {
      if (net.family === 'IPv4' && !net.internal && !net.address.startsWith('169.254')) {
        addresses.push({ name: net.name ?? 'network', address: net.address });
      }
    }
  }

  return addresses;
}

function pickMobileIp(addresses) {
  const byPrefix = (prefix) => addresses.find((item) => item.address.startsWith(prefix));

  return (
    byPrefix('192.168.') ||
    addresses.find((item) => item.address.startsWith('10.') && !String(item.name).toLowerCase().includes('warp')) ||
    byPrefix('172.20.') ||
    addresses.find((item) => !String(item.name).toLowerCase().includes('warp') && !item.address.startsWith('172.16.0.')) ||
    addresses[0]
  );
}

function waitForApi(ms = 20000) {
  const url = `http://127.0.0.1:${API_PORT}/api/health`;
  const start = Date.now();

  return new Promise((resolve) => {
    const tick = async () => {
      try {
        const res = await fetch(url);
        if (res.ok) {
          resolve(true);
          return;
        }
      } catch {
        /* retry */
      }
      if (Date.now() - start > ms) {
        resolve(false);
        return;
      }
      setTimeout(tick, 400);
    };
    tick();
  });
}

const children = [];
let shuttingDown = false;

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  process.exit(code);
}

function spawnProc(name, command, args) {
  const child = spawn(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: false,
  });
  children.push(child);
  child.on('exit', (code) => {
    if (!shuttingDown && code && code !== 0) {
      console.error(`\n  ${name} exited with code ${code}\n`);
      shutdown(code);
    }
  });
  return child;
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

async function main() {
  console.log('\n  Gokul Portfolio — full-stack dev\n');
  console.log('  Freeing ports 8000, 8080…');
  freeDevPorts();

  await new Promise((r) => setTimeout(r, 800));

  console.log(`  Starting API on http://127.0.0.1:${API_PORT} …`);
  spawnProc('API', 'python', [
    '-m',
    'uvicorn',
    'backend.main:app',
    '--host',
    '127.0.0.1',
    '--port',
    String(API_PORT),
  ]);

  const apiUp = await waitForApi();
  if (!apiUp) {
    console.error(`
  API failed to start on port ${API_PORT}.
  Another app may still be using it.

  Fix:
    pnpm run dev:clean
    pnpm run dev

  Or test API only:
    pnpm run dev:api
`);
    shutdown(1);
    return;
  }

  const health = await fetch(`http://127.0.0.1:${API_PORT}/api/health`).then((r) => r.json());
  console.log(`  API ready (smtp_configured: ${health.smtp_configured})\n`);

  spawnProc('Vite', process.execPath, [
    viteBin,
    '--host',
    '--port',
    String(PORT),
    '--strictPort',
    '--open',
    '/hello.html',
  ]);

  const addresses = getNetworkAddresses();
  const mobile = pickMobileIp(addresses);
  const mobileUrl = `http://${mobile?.address ?? 'localhost'}:${PORT}/hello.html`;

  console.log(`  Frontend:  http://localhost:${PORT}/hello.html`);
  console.log(`  API:       http://127.0.0.1:${API_PORT}/api/health`);
  console.log('  Contact form needs BOTH running (proxy /api → 8000)\n');

  if (addresses.length) {
    console.log('  Network (phone, same Wi-Fi):');
    for (const { name, address } of addresses) {
      console.log(`    • ${address}  (${name})  →  http://${address}:${PORT}/hello.html`);
    }
  }

  console.log(`\n  Mobile QR: ${mobileUrl}\n`);
  qrcode.generate(mobileUrl, { small: true });
  console.log('\n  Press Ctrl+C to stop.\n');
}

main().catch((err) => {
  console.error(err);
  shutdown(1);
});
