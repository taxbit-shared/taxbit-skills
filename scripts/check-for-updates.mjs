#!/usr/bin/env node
// Checks whether the skills lag what they document, and keeps one GitHub issue
// open that says what to regenerate. Run weekly by
// .github/workflows/check-for-updates.yml.
//
//   node scripts/check-for-updates.mjs             check, then open, update or close the issue
//   node scripts/check-for-updates.mjs --dry-run   check and print the issue body; touch no issues
//
// Two checks:
// - React SDK: npm's `latest` @taxbit/react-sdk against the version SKILL.md documents.
// - API: `generate-api-reference.mjs --check` against the live spec. Needs
//   APIDOCS_TOKEN, a token that can read taxbit-private/readme-apidocs; without
//   it this check is skipped and the issue says so.
//
// Issues are created with GH_TOKEN (the workflow's token). The issue carries
// MARKER, so a rerun edits it instead of opening another. When both checks
// pass, an open issue is closed.
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SDK_SKILL = join(ROOT, 'skills', 'react-sdk', 'SKILL.md');
const SDK_PACKAGE = '@taxbit/react-sdk';
const MARKER = '<!-- check-for-updates -->';
const TITLE = 'Skills are behind what they document';

export function documentedVersion(skillText) {
  const match = skillText.match(/^- \*\*Latest version:\*\* `([^`]+)`/m);
  if (!match) throw new Error(`No "- **Latest version:** \`x.y.z\`" line in ${SDK_SKILL}`);
  return match[1];
}

async function latestSdkVersion() {
  const response = await fetch(`https://registry.npmjs.org/${SDK_PACKAGE}/latest`);
  if (!response.ok) throw new Error(`npm registry returned ${response.status} for ${SDK_PACKAGE}`);
  return (await response.json()).version;
}

async function checkSdk() {
  const documented = documentedVersion(readFileSync(SDK_SKILL, 'utf8'));
  const latest = await latestSdkVersion();
  return { behind: documented !== latest, documented, latest };
}

function checkApi() {
  const token = process.env.APIDOCS_TOKEN;
  if (!token) return { skipped: true };
  const run = spawnSync(process.execPath, [join(ROOT, 'scripts', 'generate-api-reference.mjs'), '--check'], {
    encoding: 'utf8',
    env: { ...process.env, GH_TOKEN: token },
  });
  if (run.status === 0) return { behind: false };
  const stale = run.stderr.match(/skills\/api\/reference is out of date: (.*)\. Run /);
  if (!stale) throw new Error(`generate-api-reference.mjs --check failed:\n${run.stderr}`);
  return { behind: true, files: stale[1].split(', ') };
}

export function issueBody(sdk, api) {
  const lines = [MARKER, '', 'The weekly check found skills that lag what they document. Regenerate them with the recipes in `CLAUDE.md`, then release.', ''];
  if (sdk.behind) {
    lines.push(
      '## React SDK skill',
      '',
      `\`${SDK_PACKAGE}\` \`${sdk.latest}\` is on npm; \`skills/react-sdk/SKILL.md\` documents \`${sdk.documented}\`.`,
      '',
      `Read the package's \`CHANGELOG.md\` from \`${sdk.documented}\` to \`${sdk.latest}\`, check it against the \`.d.ts\` files and bundle (\`npm pack ${SDK_PACKAGE}@${sdk.latest}\`), and follow "How to Regenerate the React SDK Skill".`,
      '',
    );
  }
  if (api.behind) {
    lines.push(
      '## API skill',
      '',
      `The spec in \`readme-apidocs\` changed. ${api.files.length} reference files are out of date:`,
      '',
      ...api.files.map((file) => `- \`${file}\``),
      '',
      'Run `node scripts/generate-api-reference.mjs`, review the diff, and update `src/api-notes/` or `src/field-notes.mjs` where the guidance changed.',
      '',
    );
  }
  if (api.skipped) {
    lines.push('_The API check was skipped: the `APIDOCS_TOKEN` secret isn\'t set, so the spec in `taxbit-private/readme-apidocs` can\'t be read._', '');
  }
  return lines.join('\n');
}

function gh(args) {
  return execFileSync('gh', args, { encoding: 'utf8' });
}

function openIssue() {
  const issues = JSON.parse(gh(['issue', 'list', '--state', 'open', '--limit', '100', '--json', 'number,body']));
  return issues.find((issue) => issue.body.includes(MARKER))?.number;
}

async function main(argv) {
  const sdk = await checkSdk();
  const api = checkApi();
  const behind = sdk.behind || api.behind;
  console.error(`React SDK: documents ${sdk.documented}, npm latest ${sdk.latest}${sdk.behind ? ' (behind)' : ''}.`);
  console.error(`API: ${api.skipped ? 'skipped (no APIDOCS_TOKEN)' : api.behind ? `${api.files.length} files out of date` : 'up to date'}.`);

  const body = issueBody(sdk, api);
  if (argv.includes('--dry-run')) {
    if (behind) console.log(body);
    return;
  }

  const existing = openIssue();
  if (behind && existing) {
    gh(['issue', 'edit', String(existing), '--body', body]);
    console.error(`Updated issue #${existing}.`);
  } else if (behind) {
    console.error(gh(['issue', 'create', '--title', TITLE, '--body', body]).trim());
  } else if (existing) {
    gh(['issue', 'close', String(existing), '--comment', 'The weekly check found nothing behind.']);
    console.error(`Closed issue #${existing}.`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
