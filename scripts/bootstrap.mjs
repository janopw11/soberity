import { spawnSync } from 'node:child_process';
import { constants, copyFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const pnpmVersion = manifest.packageManager.split('@')[1];

function run(command, args, cwd = root, capture = false) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: capture ? 'pipe' : 'inherit',
  });
  if (result.error || result.status !== 0) {
    throw new Error(
      `${command} failed (${result.error?.code ?? result.status}). Check installation, network access and permissions.`,
    );
  }
  return `${result.stdout ?? ''}${result.stderr ?? ''}`;
}

try {
  if (process.platform === 'win32') {
    throw new Error(
      'Use WSL with Node 24, pnpm and JDK 21 installed inside WSL.',
    );
  }
  const [major, minor] = process.versions.node.split('.').map(Number);
  if (major !== 24 || minor < 14) {
    throw new Error('Node 24.14.0 or newer on the 24 LTS line is required.');
  }
  const actualPnpm = run('pnpm', ['--version'], root, true).trim();
  if (actualPnpm !== pnpmVersion) {
    throw new Error(`Install pnpm ${pnpmVersion}; found ${actualPnpm}.`);
  }
  // The wrapper uses JAVA_HOME when set; validate that same Java installation.
  const java = process.env.JAVA_HOME
    ? join(process.env.JAVA_HOME, 'bin', 'java')
    : 'java';
  if (!/version "21(?:\.|\x22)/.test(run(java, ['-version'], root, true))) {
    throw new Error('JDK 21 is required. Check JAVA_HOME and PATH.');
  }

  run('pnpm', ['install', '--frozen-lockfile']);
  run('./mvnw', ['--batch-mode', 'verify'], join(root, 'backend'));

  for (const directory of ['apps/consumer', 'backend']) {
    try {
      copyFileSync(
        join(root, directory, '.env.example'),
        join(root, directory, '.env'),
        constants.COPYFILE_EXCL,
      );
      console.log(`Created ${directory}/.env from the public template.`);
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      console.log(`Preserved existing ${directory}/.env.`);
    }
  }
  console.log(
    'Tooling ready. Run pnpm check and pnpm build. No app/server exists yet.',
  );
} catch (error) {
  console.error(`Bootstrap failed: ${error.message}`);
  process.exitCode = 1;
}
