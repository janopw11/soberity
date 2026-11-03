import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  mkdtempSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  statSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), 'soberity-backup-test-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const envFile = join(directory, '.env');
  const log = join(directory, 'calls');
  writeFileSync(
    envFile,
    '# Synthetic environment, no services or credentials.\n',
  );
  writeFileSync(
    join(directory, 'docker'),
    `#!/bin/sh
echo "$*" >> "$TEST_CALLS"
case "$*" in
  *pg_dump*) printf 'synthetic-dump'; exit "\${TEST_DUMP_EXIT:-0}" ;;
  *createdb*) exit "\${TEST_CREATE_EXIT:-0}" ;;
  *pg_restore*) cat > /dev/null ;;
esac
`,
    { mode: 0o700 },
  );
  const env = {
    ...process.env,
    PATH: `${directory}:${process.env.PATH}`,
    STAGING_ENV_FILE: envFile,
    TEST_CALLS: log,
  };
  return { directory, log, env };
}

test('backup writes an owner-only final dump only after success', (t) => {
  const { directory, log, env } = fixture(t);
  const destination = join(directory, 'backups with spaces');
  const result = spawnSync('sh', ['infra/staging/backup-db.sh', destination], {
    env,
  });
  assert.equal(result.status, 0, result.stderr.toString());
  const files = readdirSync(destination);
  assert.equal(files.length, 1);
  assert.ok(files[0].endsWith('.dump'));
  assert.equal(
    readFileSync(join(destination, files[0]), 'utf8'),
    'synthetic-dump',
  );
  assert.equal(statSync(join(destination, files[0])).mode & 0o777, 0o600);
  assert.match(readFileSync(log, 'utf8'), /--project-name soberity-staging/);
});

test('failed pg_dump removes partial output and reports failure', (t) => {
  const { directory, env } = fixture(t);
  const destination = join(directory, 'backups');
  const result = spawnSync('sh', ['infra/staging/backup-db.sh', destination], {
    env: { ...env, TEST_DUMP_EXIT: '1' },
  });
  assert.notEqual(result.status, 0);
  assert.deepEqual(readdirSync(destination), []);
});

test('restore refuses live databases and unsafe names without calling Docker', (t) => {
  const { directory, log, env } = fixture(t);
  const dump = join(directory, 'trusted.dump');
  writeFileSync(dump, 'synthetic');
  for (const target of [
    'soberity',
    'postgres',
    'restore_check_unsafe;DROP',
    'restore_check_Uppercase',
  ]) {
    const result = spawnSync(
      'sh',
      ['infra/staging/restore-check.sh', dump, target],
      { env },
    );
    assert.notEqual(result.status, 0);
  }
  assert.throws(() => readFileSync(log), { code: 'ENOENT' });
});

test('existing restore database prevents pg_restore; successful drill never drops or cleans', (t) => {
  const { directory, log, env } = fixture(t);
  const dump = join(directory, 'trusted.dump');
  writeFileSync(dump, 'synthetic');
  const args = ['infra/staging/restore-check.sh', dump, 'restore_check_test'];
  const refused = spawnSync('sh', args, {
    env: { ...env, TEST_CREATE_EXIT: '1' },
  });
  assert.notEqual(refused.status, 0);
  assert.doesNotMatch(readFileSync(log, 'utf8'), /pg_restore/);
  writeFileSync(log, '');
  const restored = spawnSync('sh', args, { env });
  assert.equal(restored.status, 0, restored.stderr.toString());
  const calls = readFileSync(log, 'utf8');
  assert.match(calls, /pg_restore.*--exit-on-error/);
  assert.doesNotMatch(calls, /dropdb|--clean|down/);
});
