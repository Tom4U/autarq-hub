#!/usr/bin/env node
import { existsSync } from 'fs';

const raw = process.env.CLAUDE_TOOL_RESULT_FILE_PATH ?? '';
const f = raw.replace(/\\/g, '/');

if (f.endsWith('.ts') && !f.endsWith('.test.ts') && !f.endsWith('.d.ts')) {
  const t = f.replace(/\.ts$/, '.test.ts');
  if (!existsSync(t)) {
    process.stdout.write(`NOTE: No test found for ${f} — please create ${t} (TDD Red-Green).\n`);
  }
}

if (f.endsWith('.feature')) {
  const steps = f
    .replace(/specs[/\\]features/, 'specs/step-definitions')
    .replace(/\.feature$/, '.steps.ts');
  if (!existsSync(steps)) {
    process.stdout.write(
      `NOTE: No step-definitions found for ${f} — please create ${steps} (BDD Red-Green).\n`,
    );
  }
}
