---
name: api
description: Helps developers integrate with the Taxbit REST API. Use when writing server-side code that interacts with Taxbit endpoints for account owners, accounts, transactions, tax documentation, gains, inventory, or form items. Also use when setting up authentication or handling webhooks. For the React SDK (front-end tax form collection), use the react-sdk skill instead.
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
- **Transactions** — trades, transfers, withdrawals, and other taxable events
- **Tax Documentation** — W-9, W-8BEN, W-8BEN-E, self-certification forms
- **Gains & Inventory** — cost basis tracking, disposition methods, gain/loss calculations
- **Form Items** — IRS form line items (1099-B, 1099-MISC, etc.)
- **Documents** — generated tax documents and reports
- **Payers** — payer/filer entity management
- **Real-Time TIN Validation** — validate TINs against IRS records

## Base URLs

```
Production: https://api.multi1.enterprise.taxbit.com/v1
Staging:    https://api.multi1.enterprise-staging.taxbit.com/v1
```

## Authentication

All requests require a Bearer token. There are two token types:

### Tenant-Scoped Token

Used for most API operations (account owners, accounts, transactions, gains, inventory, form items, documents, payers).

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
  "account_owner_id": "<ACCOUNT_OWNER_TAXBIT_ID>"
}
```

You can also use your external ID instead of `account_owner_id`:
```json
{
  "client_id": "<YOUR_CLIENT_ID>",
  "client_secret": "<YOUR_CLIENT_SECRET>",
  "grant_type": "client_credentials",
  "tenant_id": "<YOUR_TENANT_ID>",
  "id": "<YOUR_EXTERNAL_ACCOUNT_OWNER_ID>"
}
```

**Token response (both types):**
```json
{
  "access_token": "eyJhbG...",
  "expires_in": 86400,
  "token_type": "Bearer"
}
```

- Tokens are valid for **24 hours** (86,400 seconds).
- Use as `Authorization: Bearer <access_token>` on all subsequent requests.
- **Never expose `client_secret` in client-side code.** Account-owner tokens should be obtained server-side and passed to the frontend.

## Account Owners

| Method | Path | Description |
|--------|------|-------------|
| POST | `/account-owners` | Create an account owner |
| PATCH | `/account-owners/{id}` | Update an account owner |
| GET | `/account-owners/{id}` | Retrieve an account owner |
| GET | `/account-owners/{id}/us-tin-validation-status` | Get US TIN validation status |

**Create/Update fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Your system's unique identifier |
| `account_owner_type` | enum | Yes | `INDIVIDUAL` or `ENTITY` |
| `name` | string | No | Full name |
| `email` | string | No | Email address |
| `phone` | string | No | Phone number |
| `birth_date` | date | No | ISO-8601 date |
| `tin` | string | No | Tax identification number |
| `tin_type` | enum | No | `US_SSN`, `US_EIN`, `US_ATIN`, `US_ITIN`, `OTHER` |
| `tax_country_code` | string | No | ISO 3166-1 alpha-2 country code |
| `address` | object | No | `first_line`, `second_line`, `city`, `state_or_province`, `country`, `postal_code` |
| `mailing_address` | object | No | Same structure as `address` |
| `prefers_physical_mail` | boolean | No | Physical mail preference |

An `account` object can be nested inside account owner creation to create both simultaneously.

**TIN validation status values:** `PENDING`, `VALID_SSN_MATCH`, `VALID_EIN_MATCH`, `MISMATCH`, `INVALID_DATA`, `TIN_NOT_ISSUED`, `ERROR`, `FOREIGN`

## Accounts

| Method | Path | Description |
|--------|------|-------------|
| POST | `/accounts` | Create an account |
| PATCH | `/accounts/{id}` | Update an account |
| GET | `/accounts/{id}` | Retrieve an account |

**Create fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Your system's unique identifier |
| `payer_id` | UUID | No | Payer/filer identifier |
| `account_type` | enum | No | `US_IRA_TRADITIONAL`, `US_IRA_ROTH`, `US_IRA_SEP`, `US_IRA_SIMPLE` |
| `establishment_date` | date | No | ISO-8601 account creation date |
| `disposition_method` | enum | No | `HIFO`, `FIFO`, `LIFO`, `LOFO` |
| `year_end_fair_market_value` | array | No | Objects with `year_end` (4-digit year) and `fair_market_value` (USD string) |
| `secondary_account_owner_ids` | array | No | Additional owner identifiers |
| `closest_intermediary_account_id` | string | No | Upstream intermediary reference |

**Example response:**
```json
{
  "data": {
    "id": "37480283",
    "taxbit_id": "424cd1a7-981e-4df0-9dfc-639a092fb369",
    "tenant_id": "673962f6-675c-45c3-a5a0-d9369e886582",
    "date_created": "2023-08-19",
    "date_modified": "2023-10-19",
    "account_owner_id": "JohnDoe864",
    "payer_id": "a1db8f72-7fd8-44db-9d4f-9fe01ec22aac",
    "account_type": "US_IRA_TRADITIONAL",
    "establishment_date": "2020-08-19",
    "year_end_fair_market_value": [
      { "year_end": "2023", "fair_market_value": "500" }
    ],
    "disposition_method": "HIFO"
  }
}
```

## Transactions

| Method | Path | Description |
|--------|------|-------------|
| POST | `/transactions/external-id` | Send (create or update) a transaction |
| GET | `/transactions/{external-id}/{id}` | Retrieve a transaction |
| DELETE | `/transactions/{external-id}/{id}` | Delete a transaction |
| GET | `/accounts/{id}/transactions` | List transactions for an account |

Transactions use an **upsert** pattern — POST creates or updates based on your external ID.

### Transaction Aggregations

| Method | Path | Description |
|--------|------|-------------|
| GET | `/accounts/{id}/income` | Aggregate income data for a given time period |

## Tax Documentation

| Method | Path | Description |
|--------|------|-------------|
| POST | `/account-owners/{id}/tax-documentation-data/w-9` | Submit W-9 |
| POST | `/account-owners/{id}/tax-documentation-data/w-8ben` | Submit W-8BEN |
| POST | `/account-owners/{id}/tax-documentation-data/w-8ben-e` | Submit W-8BEN-E |
| POST | `/account-owners/{id}/tax-documentation-data/self-certification` | Submit self-certification |
| GET | `/account-owners/{id}/tax-documentation-data` | Retrieve tax documentation data |
| GET | `/account-owners/{id}/tax-documentation-status` | Get documentation status |
| POST | `/account-owners/{id}/tax-documentation-data/document` | Generate a PDF document |
| GET | `/account-owners/{id}/tax-documentation-data/document/{document-id}` | Retrieve a generated document |
| GET | `/tax-treaty-rates` | Get tax treaty withholding rates |

### W-9 Submission

Key request body fields:

| Field | Type | Description |
|-------|------|-------------|
| `w9_tax_classification` | enum | `INDIVIDUAL`, `C_CORPORATION`, `S_CORPORATION`, `PARTNERSHIP`, `TRUST_ESTATE`, `LLC` variants, `SOLE_PROPRIETOR`, `OTHER` |
| `tin` | string | Tax identification number |
| `tin_type` | enum | `US_SSN`, `US_EIN`, `US_ATIN`, `US_ITIN`, `OTHER` |
| `address` | object | `first_line`, `second_line`, `city`, `state_or_province`, `postal_code`, `country` |
| `exempt_payee_code` | string | Withholding exemption code |
| `exempt_fatca_code` | string | FATCA exemption code |
| `tax_residences` | array | Country, TIN, and status for each tax residence |

### W-8BEN Submission (Non-US Individuals)

Key request body fields:

| Field | Type | Description |
|-------|------|-------------|
| `permanent_address` | object | Permanent residence address |
| `mailing_address` | object | Optional mailing address if different |
| `tax_residences` | array | Tax residences with country, TIN, and exemption info |
| `completed_for` | enum | `ACCOUNT_HOLDER` or `REGARDED_OWNER` |
| `control_persons` | array | Individuals with ownership/control over entities |

### W-8BEN-E Submission (Non-US Entities)

Key request body fields:

| Field | Type | Description |
|-------|------|-------------|
| `completed_for` | enum | `ACCOUNT_HOLDER` or `REGARDED_OWNER` |
| `entity_type` | enum | Corporation, Partnership, Trust variants, Government entities, etc. |
| `permanent_address` | object | Physical address |
| `mailing_address` | object | Optional correspondence address |
| `tax_residences` | array | Country-specific tax information with TIN |
| `controlling_persons` | array | Name, address, citizenship, birth details, ownership percentage, role |
| `limitation_on_benefits` | enum | LOB provisions (Government, Tax-exempt pension, etc.) |
| `type_of_income` | enum | `ROYALTIES_OTHER` or `BUSINESS_PROFITS` |
| `exemption_codes` | object | Payee and FATCA exemption codes |

### Self-Certification Submission (CRS/CARF/DAC8)

Key request body fields:

| Field | Type | Description |
|-------|------|-------------|
| `completed_for` | enum | `ACCOUNT_HOLDER` or `REGARDED_OWNER` |
| `classification` | enum | `INDIVIDUAL`, `FINANCIAL_INSTITUTION` variants, `ACTIVE_NFE` variants, `PASSIVE_NFE` |
| `account_type` | enum | `FINANCIAL_INSTITUTION`, `PASSIVE_NON_FINANCIAL_ENTITY`, `ACTIVE_NON_FINANCIAL_ENTITY` |
| `entity_type` | enum | `TRUST`, `SIMILAR_TO_TRUST`, `OTHER` |
| `tax_residences` | array | Country, TIN, `tin_not_required`, `tin_not_required_reason` (`NOT_ISSUED`, `NOT_REQUIRED`, `OTHER`) |
| `address` | object | `first_line`, `second_line`, `city`, `state_or_province`, `postal_code`, `country` |
| `controlling_persons` | array | See below |
| `signature_capacity` | enum | `OWNER`, `AUTHORIZED_SIGNER`, `TRUSTEE`, `EXECUTOR`, `GUARDIAN`, `OTHER` |

**Controlling person fields:** `name`, `date_of_birth`, `address`, `mailing_address`, `country_of_birth`, `country_of_citizenship`, `city_of_birth`, `role` (`SETTLOR`, `TRUSTEE`, `PROTECTOR`, `BENEFICIARY`, `OWNER`, `SENIOR_MANAGING_OFFICIAL`, `OTHER`, plus `_EQUIVALENT` variants), `ownership_percentage`, `tax_residences`

### Tax Documentation Status Response

| Field | Type | Description |
|-------|------|-------------|
| `calculation_status` | enum | `in_progress` or `complete` |
| `completed_for` | enum | `ACCOUNT_HOLDER` or `REGARDED_OWNER` |

Status includes completion details across W-9/W-8, Digital Platform Seller, and Self-Certification form types, plus expiration dates (3 years from submission) and any issues requiring resubmission.

### Tax Treaty Rates

`GET /tax-treaty-rates` returns withholding rates for a specified country, including general rates and special rates with treaty article references for interest, dividends, and other income.

## Gains

| Method | Path | Description |
|--------|------|-------------|
| GET | `/gains` | All gains — detailed cost bases, proceeds, and gains/losses (IRS Form 8949 / 1099-B line items) |
| GET | `/gains/breakdown` | Short-term, long-term, and total gains/losses |
| GET | `/gains/summary` | Total gains for a specified period |

## Inventory

| Method | Path | Description |
|--------|------|-------------|
| GET | `/inventory` | Lots and summary for a single asset (requires `asset_id` or `asset_code`) |
| GET | `/inventory/summaries` | Summary of total cost and quantity for each undisposed asset |

Lots are sorted by disposition method order (HIFO, FIFO, LIFO, or LOFO).

### Transfer Lots

| Method | Path | Description |
|--------|------|-------------|
| POST | `/transfer-lots/transactions/{transaction-id}` | Create transfer lots with cost bases for a deposit transaction |
| GET | `/transfer-lots/transactions/{transaction-id}` | Get transfer lots for a transaction |
| DELETE | `/transfer-lots/transactions/{transaction-id}` | Delete transfer lots |
| GET | `/transfer-lots/transactions` | Get transfer lots for multiple transactions |

## Disposition Methods

| Method | Path | Description |
|--------|------|-------------|
| POST | `/accounts/{id}/disposition-methods/history` | Create disposition methods for an account |
| PATCH | `/accounts/{id}/disposition-methods/history/{history-id}` | Update a disposition method record |
| DELETE | `/accounts/{id}/disposition-methods/history/{history-id}` | Delete a disposition method record |
| GET | `/accounts/{id}/disposition-methods/history` | Get disposition methods for an account |
| GET | `/filers/{id}/disposition-methods/history` | Get disposition methods for a filer |

Valid disposition methods: `HIFO`, `FIFO`, `LIFO`, `LOFO`

## Form Items

| Method | Path | Description |
|--------|------|-------------|
| GET | `/users/{user-id}/form-items/{form-item-id}` | Get a form item |
| PUT | `/users/{user-id}/form-items/{form-item-id}` | Upsert a form item |
| DELETE | `/users/{user-id}/form-items/{form-item-id}` | Delete a form item |
| POST | `/form-items/batch` | Upsert a collection of form items |
| GET | `/users/{user-id}/form-items` | Get all form items for a user within a tax year |
| GET | `/form-items/aggregates/{document-type}` | Aggregates by document type (total row count, proceeds, cost basis) |

## Documents

| Method | Path | Description |
|--------|------|-------------|
| GET | `/accounts/{id}/tax-documents` | Get released tax documents for an account (latest of each type/year by default) |

## Real-Time TIN Validation

| Method | Path | Description |
|--------|------|-------------|
| POST | `/validations/us-tin` | Validate a US TIN and name |
| GET | `/validations/us-tin/{validation-id}` | Get validation results |

## Payers

| Method | Path | Description |
|--------|------|-------------|
| GET | `/tenants/{tenant-id}/payers` | Get all payers for a tenant |

## Rate Limits

Default rate limit is **50 requests per second**. A `429 Too Many Requests` response indicates throttling — implement exponential backoff. Contact your Implementation Manager for higher limits.

## Error Handling

Standard HTTP status codes:
- `400` — Bad request (invalid parameters)
- `401` — Unauthorized (invalid/expired token)
- `403` — Forbidden (insufficient permissions)
- `404` — Not found
- `409` — Conflict (duplicate ID)
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
- The API returns masked TINs (e.g., `***-**-0000`) — use masked values in any display or logging.
- Tax documentation responses contain sensitive personal data (addresses, dates of birth, citizenship) — treat the entire response as PII.
- Do not add new data dumps, exports, or bulk data retrieval without explicit human review and sign-off.

### Transport & Infrastructure

- All API calls must use HTTPS (the base URLs enforce this).
- Never proxy tenant credentials or bearer tokens through client-side code.
- If forwarding account-owner tokens to a frontend, use httpOnly secure cookies or a server-side session — not localStorage or URL parameters.
- Webhook receivers must use HTTPS and verify request signatures before processing.

### Secrets in Code & Configuration

- Never hardcode secrets in Dockerfiles, docker-compose files, or CI pipeline configs. Use build secrets, environment injection, or a secrets manager.
- API keys and tokens belong in GitHub Actions secrets or approved secret stores — never in CLAUDE.md, scripts, or committed config files.
- Always add `.env` to `.gitignore`. Verify `.npmignore` or `files` in `package.json` excludes `.env` and config files with secrets before publishing.
- When generating example code, always use obvious placeholders like `<YOUR_CLIENT_SECRET>` — never real or realistic-looking values.

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
2. **Use the right token type** — tenant-scoped for most operations, account-owner-scoped for tax documentation submission and React SDK.
3. **Use idempotent external IDs** — account owners, accounts, and transactions all use your system's IDs, making operations safely retryable.
4. **Handle the upsert pattern** — POST to `/transactions/external-id` both creates and updates.
5. **Nest account creation** — you can create an account owner and their first account in a single POST to `/account-owners`.
6. **Implement retry logic** — respect 429 responses with exponential backoff.
7. **Never log or expose credentials** — `client_id`, `client_secret`, and bearer tokens must be kept secure. Use environment variables.
8. **Check calculation status** — some responses include `calculation_status` (`in_progress` or `complete`). Poll until complete if needed.

## Full API Reference

For complete endpoint schemas: https://apidocs.taxbit.com/reference
For guides and workflows: https://apidocs.taxbit.com/docs/getting-started
