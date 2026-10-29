import { spawnSync } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
// Synthetic paths only; never create or print real credentials.
const ignored = [
  '.env',
  '.env.local',
  '.env.production',
  'apps/consumer/.env',
  'backend/.env.staging',
  '.secrets/firebase.json',
  'backend/secrets/firebase.json',
  'backend/dev-service-account.json',
  'backend/serviceAccountKey.json',
  'backend/soberity-firebase-adminsdk-test.json',
  'application_default_credentials.json',
  'credentials.json',
  'apps/consumer/google-services.json',
  'apps/consumer/GoogleService-Info.plist',
  'signing/private.pem',
  'signing/private.key',
  'signing/distribution.p12',
  'signing/AuthKey.p8',
  'signing/certificate.pfx',
  'signing/upload.jks',
  'signing/upload.keystore',
  'signing/profile.mobileprovision',
];
const visible = [
  'apps/consumer/.env.example',
  'backend/.env.example',
  '.env.test.example',
  '.npmrc',
  'pnpm-lock.yaml',
  'backend/.mvn/wrapper/maven-wrapper.properties',
  'backend/mvnw',
  'backend/mvnw.cmd',
];
const result = spawnSync(
  'git',
  ['check-ignore', '--no-index', '--stdin', '-z'],
  {
    cwd: root,
    input: [...ignored, ...visible].join('\0') + '\0',
    encoding: 'utf8',
  },
);
if (result.error || ![0, 1].includes(result.status)) {
  console.error(
    'Cannot check ignore rules. Run this command inside a Git checkout.',
  );
  process.exitCode = 1;
} else {
  const matches = new Set(result.stdout.split('\0').filter(Boolean));
  const failures = [
    ...ignored.filter((path) => !matches.has(path)),
    ...visible.filter((path) => matches.has(path)),
  ];
  if (failures.length > 0) {
    console.error(
      'Unexpected ignore rules for synthetic paths:',
      failures.join(', '),
    );
    process.exitCode = 1;
  } else {
    console.log(
      `PASS: ${ignored.length} credential paths ignored; ${visible.length} setup paths visible.`,
    );
  }
}
