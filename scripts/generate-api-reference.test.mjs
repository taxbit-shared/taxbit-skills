// Run with: node --test scripts/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildReference, displayPath, slug } from './generate-api-reference.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const COUNTRIES = Array.from({ length: 30 }, (_, i) => `C${i}`);

function spec(paths, schemas = {}) {
  return { openapi: '3.0.0', info: { version: '1' }, paths, components: { schemas } };
}

const API = spec({
  '/v1/widgets': {
    post: {
      operationId: 'WidgetsController_create',
      tags: ['Widgets'],
      summary: 'Create a Widget',
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Widget' }, example: { name: 'Sprocket' } } },
      },
      responses: {
        201: { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/WidgetResponse' } } } },
        400: { description: 'Bad Request' },
      },
    },
    get: {
      operationId: 'WidgetsController_list',
      tags: ['Widgets'],
      summary: 'List Widgets',
      parameters: [{ name: 'size', in: 'query', required: true, description: 'Size', schema: { type: 'string', enum: ['S', 'M'] } }],
      responses: { 200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/WidgetResponse' } } } } },
    },
  },
  '/v1/widgets/{id}': {
    get: {
      operationId: 'WidgetsController_get',
      tags: ['Widgets'],
      summary: 'Get a Widget',
      parameters: [{ name: 'id', in: 'path', required: true, description: 'Widget ID', schema: { type: 'string' } }],
      responses: { 200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/WidgetResponse' } } } } },
    },
  },
}, {
  Widget: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', description: 'The name' },
      country: { type: 'string', enum: COUNTRIES },
      address: { type: 'object', properties: { city: { type: 'string' } } },
      treaty_claim_rate_of_withholding: { type: 'string', description: 'The rate' },
    },
  },
  WidgetResponse: {
    type: 'object',
    properties: {
      data: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          country: { type: 'string', enum: COUNTRIES },
          address: { type: 'object', properties: { city: { type: 'string' } } },
          treaty_claim_rate_of_withholding: { type: 'string' },
          id: { type: 'string', description: 'Server ID' },
        },
      },
    },
  },
});

const EMBEDDED = spec({
  '/v1/my-widget': {
    get: { operationId: 'EmbeddedWidgets_get', tags: ['Widgets'], summary: 'List Widgets', responses: {} },
  },
});

const build = (notes) => buildReference({ api: API, embedded: EMBEDDED }, notes);

test('slug and displayPath', () => {
  assert.equal(slug('Real-Time TIN Validation'), 'real-time-tin-validation');
  assert.equal(displayPath('/v1/account-owners/{id}'), '/account-owners/{id}');
});

test('each area gets an index file and one file per endpoint', () => {
  const { files, count } = build({ 'widgets.md': 'Widgets are **immutable**.' });

  assert.equal(count, 4);
  assert.deepEqual(Object.keys(files).sort(), [
    'values/country.md',
    'widgets.md',
    'widgets/create-a-widget.md',
    'widgets/get-a-widget.md',
    'widgets/list-widgets-owner-token.md',
    'widgets/list-widgets.md',
  ]);
  assert.match(files['widgets.md'], /## Notes\n\nWidgets are \*\*immutable\*\*\./);
  assert.match(files['widgets.md'], /\| \[POST \/widgets\]\(widgets\/create-a-widget\.md\) \| Create a Widget \| tenant \|/);
  assert.match(files['widgets.md'], /\| \[GET \/my-widget\]\(widgets\/list-widgets-owner-token\.md\) \| List Widgets \| account owner \|/);
});

test('body fields show nesting, required flags, short enums inline, long enums in their own file', () => {
  const { files } = build();
  const create = files['widgets/create-a-widget.md'];

  assert.match(create, /\| `name` \| string \| Yes \| The name\. \|/);
  assert.match(create, /\| `address\.city` \| string \| No \|/);
  assert.match(create, /One of 30 values: see \[values\/country\.md\]\(\.\.\/values\/country\.md\)/);
  assert.match(files['values/country.md'], /30 allowed values:\n\n`C0`, `C1`/);
  assert.match(files['widgets/list-widgets.md'], /\| `size` \| string \| Yes \| Size\. One of: `S`, `M`\. \|/);
});

test('field notes are merged into descriptions', () => {
  const create = build().files['widgets/create-a-widget.md'];
  assert.match(create, /`treaty_claim_rate_of_withholding` \| string \| No \| The rate\. \*\*Note:\*\* The percentage as a plain number string/);
});

test('a response that wraps the request body lists only the added fields', () => {
  const create = build().files['widgets/create-a-widget.md'];

  assert.match(create, /\*\*Response 201\*\*: Created\n\nReturns the submitted body under `data`, plus:/);
  assert.match(create, /\| `data\.id` \| string \| No \| Server ID\. \|/);
  assert.doesNotMatch(create, /\| `data\.name` \|/);
  assert.match(create, /\*\*Errors:\*\* 400 Bad Request/);
  assert.match(create, /```json\n\{"name":"Sprocket"\}\n```/);
});

test('an identical response later in the area points back to the first', () => {
  const { files } = build();
  assert.match(files['widgets/list-widgets.md'], /\| `data\.id` \| string \| No \| Server ID\. \|/);
  assert.match(files['widgets/get-a-widget.md'], /Same fields as the response of \[List Widgets\]\(list-widgets\.md\)\./);
});

test('the committed reference matches the generator for the committed spec', () => {
  const result = spawnSync(process.execPath, ['scripts/generate-api-reference.mjs', '--check'], { cwd: ROOT, encoding: 'utf8' });
  // --check fetches the live spec with gh; skip when gh isn't available.
  if (/gh: command not found|ENOENT|authentication/i.test(result.stderr)) return;
  assert.equal(result.status, 0, result.stderr);
});
