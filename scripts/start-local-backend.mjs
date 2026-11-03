#!/usr/bin/env node
/** Local application restart only; credentials stay in memory and never enter command arguments/logs. */
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const root = fileURLToPath(new URL('..', import.meta.url));
function envFile(path) {
  if (!existsSync(path)) return {};
  return Object.fromEntries(
    readFileSync(path, 'utf8')
      .split(/\r?\n/)
      .filter((line) => /^\s*[A-Z][A-Z0-9_]*=/.test(line))
      .map((line) => {
        const at = line.indexOf('=');
        return [
          line.slice(0, at).trim(),
          line
            .slice(at + 1)
            .trim()
            .replace(/^(['"])(.*)\1$/, '$2'),
        ];
      }),
  );
}
function capture(command, args) {
  return execFileSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}
const client = envFile(join(root, 'apps/consumer/.env'));
const local = envFile(join(root, 'backend/.env'));
const api = new URL(client.EXPO_PUBLIC_API_URL ?? 'http://localhost:8090');
if (
  !['localhost', '127.0.0.1'].includes(api.hostname) ||
  api.protocol !== 'http:'
)
  throw new Error('This helper only supports a loopback development API.');
const port = api.port || '8090';
const container = 'soberity-postgres-1';
let inspected;
try {
  inspected = JSON.parse(capture('docker', ['inspect', container]))[0];
} catch {
  throw new Error(
    'Start Docker Desktop and create the local Soberity PostgreSQL container first.',
  );
}
const binding = inspected.HostConfig?.PortBindings?.['5432/tcp']?.[0];
if (!binding || !['127.0.0.1', 'localhost'].includes(binding.HostIp))
  throw new Error('Expected a loopback-only PostgreSQL container binding.');
const dbPort = binding.HostPort;
const database = Object.fromEntries(
  inspected.Config.Env.map((value) => {
    const at = value.indexOf('=');
    return [value.slice(0, at), value.slice(at + 1)];
  }),
);
if (database.POSTGRES_DB !== 'soberity')
  throw new Error(
    'This helper only targets the local soberity application database.',
  );
if (!inspected.State.Running)
  execFileSync('docker', ['start', container], { stdio: 'inherit' });
console.log(
  'Building the local backend (integration tests are not run by this helper).',
);
execFileSync(
  join(root, 'backend/mvnw'),
  ['--batch-mode', '--no-transfer-progress', '-DskipTests', 'package'],
  { cwd: join(root, 'backend'), stdio: 'inherit' },
);
let listeners = [];
try {
  listeners = capture('lsof', ['-tiTCP:' + port, '-sTCP:LISTEN'])
    .split(/\s+/)
    .filter(Boolean);
} catch {
  /* No listening process. */
}
for (const pid of listeners) {
  const command = capture('ps', ['-p', pid, '-o', 'command=']);
  const workingDirectory = capture('lsof', [
    '-a',
    '-p',
    pid,
    '-d',
    'cwd',
    '-Fn',
  ])
    .split('\n')
    .find((line) => line.startsWith('n'))
    ?.slice(1);
  if (
    !workingDirectory ||
    ![root.replace(/\/$/, ''), join(root, 'backend')].includes(
      workingDirectory,
    ) ||
    !command.includes('soberity-backend.jar')
  )
    throw new Error(
      `Port ${port} is occupied by another process. Stop it manually before continuing.`,
    );
  process.kill(Number(pid), 'SIGTERM');
}
if (listeners.length) {
  let stopped = false;
  for (let attempt = 0; attempt < 70; attempt++) {
    try {
      capture('lsof', ['-tiTCP:' + port, '-sTCP:LISTEN']);
    } catch {
      stopped = true;
      break;
    }
    await delay(500);
  }
  if (!stopped)
    throw new Error(
      'The old local backend did not stop. Wait for its requests to finish and retry.',
    );
}
const environment = {
  ...process.env,
  SPRING_PROFILES_ACTIVE: 'local',
  SPRING_DATASOURCE_URL: `jdbc:postgresql://127.0.0.1:${dbPort}/soberity`,
  SPRING_DATASOURCE_USERNAME: database.POSTGRES_USER ?? 'soberity',
  SOBERITY_DB_PASSWORD: database.POSTGRES_PASSWORD,
  SOBERITY_FIREBASE_PROJECT_ID:
    client.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? 'demo-soberity',
  SERVER_PORT: port,
  SOBERITY_CORS_ALLOWED_ORIGINS:
    local.SOBERITY_CORS_ALLOWED_ORIGINS ??
    'http://localhost:8081,http://127.0.0.1:8081,http://localhost:8082,http://127.0.0.1:8082',
};
if (client.EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_URL)
  environment.FIREBASE_AUTH_EMULATOR_HOST = new URL(
    client.EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_URL,
  ).host;
else delete environment.FIREBASE_AUTH_EMULATOR_HOST;
console.log(
  `Starting local API at http://localhost:${port}. Flyway applies pending local migrations. Ctrl+C stops it.`,
);
const child = spawn(
  'java',
  [
    '-Djava.awt.headless=true',
    '-jar',
    join(root, 'backend/target/soberity-backend.jar'),
  ],
  { cwd: root, env: environment, stdio: 'inherit' },
);
process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
child.on('exit', (code) => {
  process.exitCode = code ?? 0;
});
