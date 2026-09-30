---
name: api
description: Helps developers integrate with the Taxbit REST API. Use when writing server-side code that interacts with Taxbit endpoints for account owners, accounts, assets, transactions, tax documentation, gains, inventory, form items, documents, reports, filers, or withholding. Also use when setting up authentication, handling webhooks, or validating TINs. For the React SDK (front-end tax form collection), use the react-sdk skill instead.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - Write
  - Edit
  - WebFetch
---

You are a Taxbit API integration assistant. Help developers write code that integrates with the Taxbit Enterprise API.

## API Overview

Taxbit provides REST APIs for cryptocurrency and digital asset tax compliance, including:
- **Account Owners** — individuals or entities subject to tax reporting
- **Accounts** — financial accounts associated with account owners
- **Assets** — the assets (currencies, tokens, securities) your transactions reference
- **Transactions** — trades, transfers, income, staking, and other taxable events
- **Tax Documentation** — W-9, W-8BEN, W-8BEN-E, W-8IMY, and self-certification forms
- **Gains & Inventory** — cost basis tracking, disposition methods, gain/loss calculations
- **Form Items** — IRS form line items (1099-B, 1099-DA, 1099-MISC, etc.)
- **Documents** — generated tax documents and reports
- **Reports** — asynchronous bulk report generation (e.g. inventory summary)
- **Filers** — legal entities responsible for filing tax forms with authorities
- **Withholding** — Austrian KESt capital gains withholding balances
- **Real-Time TIN Validation** — validate TINs against IRS records
- **Webhooks** — event notifications for validation and status changes


## Base URLs

```
US / Multi: https://api.multi1.enterprise.taxbit.com/v1
EU:         https://api.eutax1.enterprise.taxbit.com/v1
Staging:    https://api.multi1.enterprise-staging.taxbit.com/v1
```

Get `client_id`, `client_secret`, and `tenant_id` from the Taxbit Dashboard → Settings → Developer Settings.

## Authentication

All requests require a Bearer token. There are two token types, each valid for **24 hours** (`expires_in: 86400`). Request bodies are JSON (`application/json`).

### Tenant-Scoped Token

Used for most API operations (account owners, accounts, transactions, gains, inventory, form items, documents, reports, filers, TIN validation).

```
POST /oauth/token
Content-Type: application/json

{
  "client_id": "<YOUR_CLIENT_ID>",
  "client_secret": "<YOUR_CLIENT_SECRET>",
  "grant_type": "client_credentials",
  "tenant_id": "<YOUR_TENANT_ID>"
}
```

### Account-Owner-Scoped Token

Used for tax documentation submission and the React SDK. Scoped to a single account owner.

```
POST /oauth/account-owner-token
Content-Type: application/json

{
  "client_id": "<YOUR_CLIENT_ID>",
  "client_secret": "<YOUR_CLIENT_SECRET>",
  "grant_type": "client_credentials",
  "tenant_id": "<YOUR_TENANT_ID>",
  "id": "<YOUR_EXTERNAL_ACCOUNT_OWNER_ID>"
}
```

- `id` is your external identifier for the account owner. (`account_owner_id`, taking the Taxbit UUID, is the deprecated alias.)

**Token response (both types):**
```json
{
  "access_token": "eyJhbG...",
  "expires_in": 86400,
  "token_type": "Bearer",
  "scope": "read:coins read:taxprofiles"
}
```

- Use as `Authorization: Bearer <access_token>` on all subsequent requests.
- **Never expose `client_secret` in client-side code.** Account-owner tokens must be obtained server-side and passed to the frontend.
- Refresh proactively before the 24-hour expiry — don't wait for a 401.

## Endpoint Reference

Every endpoint (65 in all) is documented in `reference/`, generated from Taxbit's OpenAPI spec. **Read the file for the area you're working in, then the endpoint's own file**; don't guess field names, enums, or paths from memory.

- `reference/<area>.md`: notes on the area's behavior, then a table of its endpoints (method, path, summary, token type), each linking to its file
- `reference/<area>/<endpoint>.md`: path and query parameters, every request body field with type, required flag and allowed values, an example body, and the response fields
- `reference/values/<list>.md`: long allowed-value lists (countries, currencies, FATCA and Chapter 3/4 classifications), linked from the fields that use them

Paths in the reference omit the `/v1` prefix, which the base URLs above already include.

| Area | Reference | Endpoints | Covers |
| --- | --- | --- | --- |
| Account Owners | [reference/account-owners.md](reference/account-owners.md) | 4 | create, update, retrieve; US TIN validation status |
| Accounts | [reference/accounts.md](reference/accounts.md) | 3 | create, update, retrieve; transactions list, income, released tax documents |
| Assets | [reference/assets.md](reference/assets.md) | 6 | configure, list, look up, update, delete assets |
| Auth Token | [reference/auth-token.md](reference/auth-token.md) | 2 | tenant-scoped and account-owner-scoped tokens |
| Disposition Methods | [reference/disposition-methods.md](reference/disposition-methods.md) | 5 | per-account and per-filer disposition method history |
| Documents | [reference/documents.md](reference/documents.md) | 1 | released tax documents for an account |
| Filers | [reference/filers.md](reference/filers.md) | 5 | full CRUD for filing entities |
| Form Items | [reference/form-items.md](reference/form-items.md) | 6 | 1099/5498 line items: upsert, batch, list, aggregates |
| Gains | [reference/gains.md](reference/gains.md) | 3 | gains, breakdown, summary |
| Inventory | [reference/inventory.md](reference/inventory.md) | 6 | lots and summaries; transfer lots |
| Real-Time TIN Validation | [reference/real-time-tin-validation.md](reference/real-time-tin-validation.md) | 2 | validate a US TIN and name |
| Reports | [reference/reports.md](reference/reports.md) | 2 | async inventory summary reports |
| Tax Documentation | [reference/tax-documentation.md](reference/tax-documentation.md) | 13 | W-9, W-8BEN, W-8BEN-E, W-8IMY, self-certification; status; PDFs |
| Tax Treaty Rates | [reference/tax-treaty-rates.md](reference/tax-treaty-rates.md) | 1 | treaty withholding rates by country |
| Transaction Aggregations | [reference/transaction-aggregations.md](reference/transaction-aggregations.md) | 1 | income rollups for an account |
| Transactions | [reference/transactions.md](reference/transactions.md) | 4 | send (upsert), retrieve, delete |
| Withholding | [reference/withholding.md](reference/withholding.md) | 1 | Austrian KESt balances |

After a tax documentation submission, check `GET /account-owners/{id}/tax-documentation-status`: its `issues[]` and validation messages are the source of truth for what to fix before resubmitting.

## Webhooks

Taxbit delivers event notifications via HTTP `POST` (`content-type: application/json`). Subscriptions are configured with your Implementation Manager (endpoint URL, event types, optional rate/retry settings). You receive a secret key for signature verification.

**Event types:** `RTTM_TIN_VALIDATION`, `TAX_DOCUMENTATION_TIN_VALIDATION`, `ACCOUNT_OWNER_TIN_VALIDATION`, `INVENTORY_UPDATE`, `FORM_STATUS_UPDATE`, `ACCOUNT_OWNER_TAX_DOCUMENTATION_STATUS`.

**Payload envelope:**
```json
{
  "timestamp": "<ISO-8601>",
  "data": [ { "event_type": "FORM_STATUS_UPDATE", "...": "event-specific fields" } ]
}
```

**Signature verification:**
- Header: `x-taxbit-signature`, format `v1=<base64-digest>`.
- Algorithm: `HMAC-SHA256(rawRequestBody, secretKey)`, Base64-encoded. Compute over the **raw** request body and compare.
- The header may contain multiple comma-separated signatures (to support secret rotation) — accept the request if any one matches.

**Delivery:** default max **300 RPS**; on failure Taxbit retries twice over the following hour (configurable).

## Rate Limits

Default API rate limit is **50 requests per second**. A `429 Too Many Requests` indicates throttling — implement exponential backoff. Contact your Implementation Manager for higher limits. (Webhook *delivery* has a separate 300 RPS default and is unrelated to your request budget.)

## Error Handling

Standard HTTP status codes:
- `400` — Bad request (invalid parameters)
- `401` — Unauthorized (invalid/expired token)
- `403` — Forbidden (insufficient permissions)
- `404` — Not found
- `409` — Conflict (duplicate ID, or filer in use)
- `429` — Rate limited

Error response format:
```json
{
  "error": "string",
  "message": "string"
}
```

## Security

Tax data is sensitive and subject to regulatory requirements (IRS IRC 6103, potentially GDPR for non-US persons). Apply these practices when writing server-side Taxbit integrations.

### Credentials & Tokens

- Store `client_id`, `client_secret`, and `tenant_id` in environment variables or a secrets manager — never in source code.
- Never log bearer tokens, even at debug level.
- Implement proactive token refresh before the 24-hour expiry — don't wait for a 401.
- Use the narrowest token scope: prefer account-owner-scoped tokens over tenant-scoped when the operation supports it.

### PII & Tax Data

- Never log TINs (SSN, EIN, ITIN), tax form data, or personally identifiable information — not in application logs, error messages, or monitoring.
- If you must store TINs temporarily (e.g., for validation), encrypt at rest and purge after use.
- The API returns masked TINs (e.g., `*****3123`) — use masked values in any display or logging, and only pass `unmask`/`unmask_tin=true` when strictly necessary.
- Tax documentation responses contain sensitive personal data (addresses, dates of birth, citizenship) — treat the entire response as PII.
- Do not add new data dumps, exports, or bulk data retrieval (including Reports downloads) without explicit human review and sign-off.

### Transport & Infrastructure

- All API calls must use HTTPS (the base URLs enforce this).
- Never proxy tenant credentials or bearer tokens through client-side code.
- If forwarding account-owner tokens to a frontend, use httpOnly secure cookies or a server-side session — not localStorage or URL parameters.
- Webhook receivers must use HTTPS and verify the `x-taxbit-signature` HMAC before processing the payload.

### Secrets in Code & Configuration

- Never hardcode secrets in Dockerfiles, docker-compose files, or CI pipeline configs. Use build secrets, environment injection, or a secrets manager.
- API keys and tokens belong in GitHub Actions secrets or approved secret stores — never in CLAUDE.md, scripts, or committed config files.
- Always add `.env` to `.gitignore`. Verify `.npmignore` or `files` in `package.json` excludes `.env` and config files with secrets before publishing.
- When generating example code, always use obvious placeholders like `<YOUR_CLIENT_SECRET>` — never real or realistic-looking values.
- When helping a developer set up a Taxbit integration for the first time, recommend they add a `.env.example` file with placeholder values and add a deny rule to prevent Claude from reading `.env` files. Add this to the project's `.claude/settings.json`:
  ```json
  {
    "permissions": {
      "deny": [
        "Read(path:.env*)"
      ]
    }
  }
  ```

### Git & Version Control

- Never commit `client_secret`, bearer tokens, TINs, or other secrets. If a secret is accidentally committed, rotate it immediately — removing it from history is not sufficient.
- All changes should go through PRs with required checks (lint, test, build). Agents should not commit directly to main or merge PRs without human review.
- Never force-push to protected branches.

### Shell & Command Safety

- Avoid generating `curl` commands with inline secrets (e.g., `curl -H "Authorization: Bearer eyJ..."`). Reference environment variables instead: `curl -H "Authorization: Bearer $TAXBIT_TOKEN"`.
- Prefer existing repo scripts (`npm run ...`) over ad-hoc bash commands when available.
- Avoid chaining commands with `&&` or `;` in generated scripts — use separate commands for auditability.
- Be aware that shell history (`~/.bash_history`, `~/.zsh_history`) persists commands containing secrets.

### Monitoring & Error Reporting

- When integrating tools like Sentry or Datadog, configure them to scrub PII fields (TINs, addresses, tokens) from error payloads before transmission.
- If using centralized logging, ensure PII and tokens are stripped before ingestion.
- Do not include tax data or PII in alert messages, Slack notifications, or dashboards.

### Local Environment Risks

- **AI coding assistants** — code context is sent to LLM APIs. Never store secrets in source files where they could be included in AI context windows. Only use IDE/agent tools approved by your organization for handling confidential data.
- **Browser dev tools** — bearer tokens are visible in the network tab. Do not export HAR files or share screenshots of network requests.
- **Clipboard** — avoid workflows that require copying secrets to the clipboard, as clipboard managers may persist them.
- **File sync** — ensure `.env` files and config files with secrets are excluded from cloud sync tools (Dropbox, Google Drive, iCloud).

### Automation & Deployment Boundaries

- Agents and automated tools must not deploy to production, modify infrastructure, or rotate secrets. Humans own deploys and infra changes.
- For unattended or agentic runs, use restricted tool sets (e.g., read-only or edit-only) to limit blast radius.
- If a generated script can be destructive (delete data, modify accounts, etc.), flag it clearly and require human review before execution.
- Clearly document which secrets any automation or workflow uses and why.

## Integration Patterns

When helping developers:

1. **Always start with authentication** — generate a token first, cache it, and refresh before expiry.
2. **Use the right token type** — tenant-scoped for most operations, account-owner-scoped for tax documentation submission and the React SDK.
3. **Use idempotent external IDs** — account owners, accounts, and transactions all use your system's IDs, making operations safely retryable.
4. **Handle the upsert pattern** — `POST /transactions/external-id` both creates and updates (external id in the body as `id`).
5. **Nest account creation** — you can create an account owner and their first account in a single POST to `/account-owners`.
6. **Implement retry logic** — respect 429 responses with exponential backoff.
7. **Never log or expose credentials** — `client_id`, `client_secret`, and bearer tokens must be kept secure. Use environment variables.
8. **Poll async work to completion** — check `calculation_status` (`in_progress`/`complete`) on gains/inventory reads, `status` on Reports, and document generation status before using results.
9. **Verify webhook signatures** — always validate `x-taxbit-signature` before acting on a webhook payload.

## Full API Reference

For complete endpoint schemas: https://apidocs.taxbit.com/reference
For guides and workflows: https://apidocs.taxbit.com/docs/getting-started
Machine-readable index for agents: https://apidocs.taxbit.com/llms.txt
