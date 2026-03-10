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
- **Webhooks** — event-driven notifications

## Base URL

```
https://api.multi1.enterprise.taxbit.com/v1
```

## Authentication

All requests require a Bearer token obtained via OAuth client credentials flow.

**Request a token:**

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

- Tokens are valid for **24 hours** (86,400 seconds).
- Use the `access_token` from the response as `Authorization: Bearer <token>` on all subsequent requests.
- `tenant_id` is required when credentials span multiple tenants.
- For embedded/account-owner-scoped flows, use `POST /oauth-account-owner-token` instead.

**Token response:**
```json
{
  "access_token": "eyJhbG...",
  "expires_in": 86400,
  "scope": "read:coins read:taxprofiles",
  "token_type": "Bearer"
}
```

## Key Endpoints

### Account Owners

| Method  | Path                                            | Description                 |
|---------|-------------------------------------------------|-----------------------------|
| POST    | `/account-owners`                               | Create an account owner     |
| PATCH   | `/account-owners/{id}`                          | Update an account owner     |
| GET     | `/account-owners/{id}`                          | Retrieve an account owner   |
| GET     | `/account-owners/{id}/us-tin-validation-status` | Check TIN validation status |

**Create Account Owner — required fields:**
- `id` (string) — your system's unique identifier
- `account_owner_type` (enum) — `"INDIVIDUAL"` or `"ENTITY"`

**Common optional fields:** `name`, `email`, `phone`, `birth_date`, `tin`, `tin_type` (`US_SSN`, `US_EIN`, `US_ATIN`, `US_ITIN`, `OTHER`), `tax_country_code`, `address` (object with `first_line`, `second_line`, `city`, `state_or_province`, `country`, `postal_code`), `is_tax_exempt`, `us_tax_classification`, `fatca_classification`.

An `account` object can be nested inside the account owner creation to create both simultaneously.

### Accounts

| Method  | Path             | Description         |
|---------|------------------|---------------------|
| POST    | `/accounts`      | Create an account   |
| PATCH   | `/accounts/{id}` | Update an account   |
| GET     | `/accounts/{id}` | Retrieve an account |

### Transactions

| Method  | Path                               | Description                           |
|---------|------------------------------------|---------------------------------------|
| POST    | `/transactions/external-id`        | Send (create or update) a transaction |
| GET     | `/transactions/{external-id}/{id}` | Retrieve a transaction                |
| DELETE  | `/transactions/{external-id}/{id}` | Delete a transaction                  |
| GET     | `/accounts/{id}/transactions`      | List transactions for an account      |

Transactions use an **upsert** pattern — POST creates or updates based on your external ID.

### Tax Documentation

| Method  | Path                                                                 | Description                |
|---------|----------------------------------------------------------------------|----------------------------|
| POST    | `/account-owners/{id}/tax-documentation-data/w-9`                    | Submit W-9                 |
| POST    | `/account-owners/{id}/tax-documentation-data/w-8ben`                 | Submit W-8BEN              |
| POST    | `/account-owners/{id}/tax-documentation-data/w-8ben-e`               | Submit W-8BEN-E            |
| POST    | `/account-owners/{id}/tax-documentation-data/self-certification`     | Submit self-certification  |
| GET     | `/account-owners/{id}/tax-documentation-data`                        | Retrieve tax documentation |
| GET     | `/account-owners/{id}/tax-documentation-status`                      | Check documentation status |
| POST    | `/account-owners/{id}/tax-documentation-data/document`               | Generate a document        |
| GET     | `/account-owners/{id}/tax-documentation-data/document/{document-id}` | Retrieve a document        |
| GET     | `/tax-treaty-rates`                                                  | Get tax treaty rates       |

### Other Endpoints

- **Gains** — retrieve realized gains/losses
- **Inventory** — cost basis and lot tracking
- **Disposition Methods** — FIFO, LIFO, HIFO, specific identification
- **Form Items** — IRS form line item data
- **Documents** — generated tax forms and reports
- **Payers** — payer entity management
- **Real-Time TIN Validation** — validate TINs against IRS records

## Rate Limits

Default rate limit is **50 requests per second**. A `429 Too Many Requests` response indicates throttling — implement exponential backoff.

## Error Handling

Standard HTTP status codes:
- `400` — Bad request (invalid parameters)
- `401` — Unauthorized (invalid/expired token)
- `403` — Forbidden (insufficient permissions)
- `404` — Not found
- `409` — Conflict (duplicate ID)
- `429` — Rate limited

## Integration Patterns

When helping developers:

1. **Always start with authentication** — generate a token first, cache it, and refresh before expiry.
2. **Use idempotent external IDs** — account owners, accounts, and transactions all use your system's IDs, making operations safely retryable.
3. **Handle the upsert pattern** — POST to `/transactions/external-id` both creates and updates.
4. **Nest account creation** — you can create an account owner and their first account in a single POST to `/account-owners`.
5. **Implement retry logic** — respect 429 responses with exponential backoff.
6. **Never log or expose credentials** — `client_id`, `client_secret`, and bearer tokens must be kept secure. Use environment variables.

## Full API Reference

For complete endpoint schemas, refer to: https://apidocs.taxbit.com/reference
For guides and workflows, refer to: https://apidocs.taxbit.com/docs/getting-started
