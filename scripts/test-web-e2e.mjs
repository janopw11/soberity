import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const composeArgs = [
  'compose',
  '-f',
  'infra/compose/compose.yml',
  'up',
  '-d',
  '--wait',
  '--wait-timeout',
  '180',
  'firebase-auth-emulator',
];
const priorServices = spawnSync(
  'docker',
  [
    'compose',
    '-f',
    'infra/compose/compose.yml',
    'ps',
    '--status',
    'running',
    '--services',
  ],
  { cwd: root, encoding: 'utf8' },
);
const emulatorAlreadyRunning = priorServices.stdout
  ?.split(/\r?\n/)
  .includes('firebase-auth-emulator');

const start = spawnSync('docker', composeArgs, { cwd: root, stdio: 'inherit' });
if (start.status !== 0) {
  process.exit(start.status ?? 1);
}

try {
  const playwright = spawnSync(
    'pnpm',
    ['exec', 'playwright', 'test', '-c', 'apps/consumer/playwright.config.ts'],
    { cwd: root, stdio: 'inherit' },
  );
  process.exitCode = playwright.status ?? 1;
} finally {
  if (!emulatorAlreadyRunning) {
    spawnSync(
      'docker',
      [
        'compose',
        '-f',
        'infra/compose/compose.yml',
        'stop',
        'firebase-auth-emulator',
      ],
      { cwd: root, stdio: 'inherit' },
    );
  }
}
