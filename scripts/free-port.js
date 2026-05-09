import net from 'node:net';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const defaultLockRoot = path.join(root, '.codex-parallel', 'port-locks');

function canListen(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.once('error', () => resolve(false));
    server.listen({ host: '127.0.0.1', port }, () => {
      server.close(() => resolve(true));
    });
  });
}

export async function findFreePort(start = 5173, end = 5199) {
  for (let port = start; port <= end; port += 1) {
    if (await canListen(port)) return port;
  }

  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.once('error', reject);
    server.listen({ host: '127.0.0.1', port: 0 }, () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close(() => reject(new Error('Unable to resolve an ephemeral port.')));
        return;
      }
      const port = address.port;
      server.close(() => resolve(port));
    });
  });
}

export async function reserveFreePort(start = 5173, end = 5199, lockRoot = defaultLockRoot) {
  await mkdir(lockRoot, { recursive: true });

  for (let port = start; port <= end; port += 1) {
    const lockPath = path.join(lockRoot, `${port}.lock`);
    try {
      await mkdir(lockPath);
    } catch {
      continue;
    }

    if (await canListen(port)) {
      return {
        port,
        release: () => rm(lockPath, { recursive: true, force: true }),
      };
    }

    await rm(lockPath, { recursive: true, force: true });
  }

  const port = await findFreePort(0, -1);
  const lockPath = path.join(lockRoot, `${port}.lock`);
  await mkdir(lockPath);
  return {
    port,
    release: () => rm(lockPath, { recursive: true, force: true }),
  };
}
