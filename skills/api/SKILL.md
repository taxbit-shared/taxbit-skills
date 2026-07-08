    ---
name: api
description: Helps developers integrate with the Taxbit REST API. Use when writing server-side code that interacts with Taxbit endpoints for account owners, accounts, transactions, tax documentation, gains, inventory, form items, reports, or filers. Also use when setting up authentication, handling webhooks, or validating TINs. For the React SDK (front-end tax form collection), use the react-sdk skill instead.
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
- **Transactions** — trades, transfers, income, staking, and other taxable events
- **Tax Documentation** — W-9, W-8BEN, W-8BEN-E (and W-8IMY / self-certification data) forms
- **Gains & Inventory** — cost basis tracking, disposition methods, gain/loss calculations
- **Form Items** — IRS form line items (1099-B, 1099-DA, 1099-MISC, etc.)
- **Documents** — generated tax documents and reports
- **Reports** — asynchronous bulk report generation (e.g. inventory summary)
- **Filers** — legal entities responsible for filing tax forms with authorities
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

## Account Owners

| Method | Path                                            | Description                  |
| ------ | ----------------------------------------------- | ---------------------------- |
| POST   | `/account-owners`                               | Create an account owner      |
| PATCH  | `/account-owners/{id}`                          | Update an account owner      |
| GET    | `/account-owners/{id}`                          | Retrieve an account owner    |
| GET    | `/account-owners/{id}/us-tin-validation-status` | Get US TIN validation status |

**Create/Update fields:**

| Field                              | Type    | Required | Description                                                          |
| ---------------------------------- | ------- | -------- | -------------------------------------------------------------------- |
| `id`                               | string  | Yes      | Your system's unique identifier                                      |
| `account_owner_type`               | enum    | Yes      | `INDIVIDUAL` or `ENTITY`                                             |
| `name`                             | string  | No       | Full name                                                            |
| `email`                            | string  | No       | Email address                                                        |
| `phone`                            | string  | No       | Phone number                                                         |
| `birth_date`                       | date    | No       | ISO-8601 date                                                        |
| `birth_city` / `birth_country`     | string  | No       | Place of birth                                                       |
| `us_tin`                           | string  | No       | US tax identification number                                         |
| `us_tin_type`                      | enum    | No       | `US_SSN`, `US_EIN`, `US_ATIN`, `US_ITIN`, `SSN`, `EIN`, `ATIN`, `ITIN`, `OTHER` |
| `us_tax_classification`            | enum    | No       | Chapter 3 withholding classification (large enum — see docs)         |
| `fatca_classification`             | enum    | No       | Chapter 4 (FATCA) classification (large enum — see docs)             |
| `tax_residencies`                  | array   | No       | `country`, `tin`, `tin_type`, `tin_not_required`, `tin_not_required_reason` (`NOT_ISSUED`/`NOT_REQUIRED`/`OTHER`) |
| `controlling_persons`              | array   | No       | Name, role, ownership %, birth details, address, tax residencies     |
| `address` / `mailing_address`      | object  | No       | `first_line`, `second_line`, `city`, `state_or_province`, `country`, `postal_code` |
| `giin`                             | string  | No       | Global Intermediary Identification Number                            |
| `vat_id` / `vat_country_code`      | string  | No       | VAT registration                                                     |
| `business_registration_number` / `business_registration_country_code` | string | No | Business registration                                 |
| `is_tax_exempt`                    | boolean | No       | Tax-exempt flag                                                      |
| `valid_self_certification_on_file` | boolean | No       | Nullable                                                            |
| `prefers_physical_mail`            | boolean | No       | Physical mail preference                                             |

- Set `tax_residencies` or `controlling_persons` to `null` on PATCH to clear all existing entries.
- The flat `tin` / `tin_type` / `tax_country_code` fields are **deprecated** — use `us_tin`/`us_tin_type` and `tax_residencies`.
- An `account` object can be nested inside account owner creation to create both simultaneously.
- Response wraps the object under `data` with server fields: `taxbit_id` (UUID), `tenant_id`, `date_created`, and masked TIN values.

**TIN validation status (`GET .../us-tin-validation-status`)** — `status` values: `PENDING`, `FOREIGN`, `INVALID_DATA`, `VALID_SSN_MATCH`, `VALID_EIN_MATCH`, `VALID_SSN_EIN_MATCH`, `TIN_NOT_ISSUED`, `MISMATCH`, `UNPROCESSED`. Plus `validation_date`.

## Accounts

| Method | Path             | Description         |
| ------ | ---------------- | ------------------- |
| POST   | `/accounts`      | Create an account   |
| PATCH  | `/accounts/{id}` | Update an account   |
| GET    | `/accounts/{id}` | Retrieve an account |

**Create/Update fields:**

| Field                             | Type   | Required | Description                                                                 |
| --------------------------------- | ------ | -------- | --------------------------------------------------------------------------- |
| `id`                              | string | Yes      | Your system's unique identifier                                             |
| `account_owner_id`                | string | Yes      | Reference to an existing account owner                                      |
| `filer_id`                        | UUID   | No       | Filer identifier                                                            |
| `account_type`                    | enum   | No       | `US_IRA_TRADITIONAL`, `US_IRA_ROTH`, `US_IRA_SEP`, `US_IRA_SIMPLE`, `DEPOSITORY`, `DEPOSITORY_SEMP_ONLY`, `CUSTODIAL`, `CASH_VALUE_INSURANCE_CONTRACT`, `ANNUITY_CONTRACT`, `INVESTMENT_ENTITY_ACCOUNT` |
| `establishment_date`              | date   | No       | ISO-8601 account creation date                                              |
| `closure_date`                    | date   | No       | ISO-8601 account closure date                                               |
| `disposition_method`              | enum   | No       | `HIFO`, `FIFO`, `LIFO`, `LOFO`                                              |
| `year_end_fair_market_value`      | array  | No       | Objects with `year_end` (4-digit year), `fair_market_value` (string), `currency` (ISO-4217, defaults `USD`) |
| `secondary_account_owner_ids`     | array  | No       | Additional owner identifiers                                                |
| `closest_intermediary_account_id` | string | No       | Upstream intermediary reference                                             |

## Transactions

| Method | Path                          | Description                           |
| ------ | ----------------------------- | ------------------------------------- |
| POST   | `/transactions/external-id`   | Send (create or update) a transaction |
| GET    | `/transactions/{id}`          | Retrieve a transaction by your ID     |
| DELETE | `/transactions/{id}`          | Delete a transaction                  |
| GET    | `/accounts/{id}/transactions` | List transactions for an account      |

Transactions use an **upsert** pattern. `POST /transactions/external-id` is a static path — the external transaction id goes in the request body as `id`, **not** in the URL.

**Key request fields:**

| Field                | Type          | Required | Description                                                        |
| -------------------- | ------------- | -------- | ------------------------------------------------------------------ |
| `type`               | enum          | Yes      | `adjustment`, `cost-basis-transfer`, `deposit`, `expense`, `income`, `stake`, `trade`, `unstake`, `withdraw`, `contribution`, `distribution` |
| `id`                 | string        | Yes      | Your unique transaction identifier                                 |
| `account_id`         | string        | Yes      | Your unique account identifier                                     |
| `datetime`           | date-time     | Yes      | ISO-8601                                                          |
| `parent_id`          | string        | Cond.    | Required when `type` = `adjustment`                                |
| `subtype`            | enum          | No       | e.g. `airdrop`, `fee`, `gift`, `inheritance`, `internal-personal`, `reward`, `staking-reward`, `royalties`, `referral-bonus`, `payment-goods`, `payment-services`, `rollover` (see full list in docs) |
| `disposition_method` | enum          | No       | `HIFO`, `FIFO`, `LIFO`, `LOFO`, `SPECID` (SPECID requires `inventory_lots`) |
| `received` / `sent`  | array         | No       | Amounts received/sent — each: `asset_amount` (`{asset:{code}, amount}`), optional `rates`, `withholdings` (received), `inventory_lots` (sent) |
| `fees`               | array         | No       | Fees paid; same item shape as `sent`                               |
| `metadata.tags`      | object        | No       | Key-value pairs                                                    |
| `retirement_info`    | object        | No       | `distribution_code`, `contribution_year`                           |

`withholdings[]` items: `regime_type` (`us-federal`, `us-state`, `eu-dac7`), `state` (2-char, required if `us-state`), `asset_amount`, `rates`. Response: `{ "status": "success", "message": "Transaction post successful." }`.

**List transactions** query params: `continuation_key`, `page_size`, `start_date`, `end_date`, `sort_by` (`-date` default, `+date`).

### Income Aggregation

| Method | Path                    | Description                                   |
| ------ | ----------------------- | --------------------------------------------- |
| GET    | `/accounts/{id}/income` | Aggregate income data for a given time period |

Query params: `start_date` (inclusive), `end_date` (exclusive), `roll_up` (`year`/`y`/`month`/`m`). Returns `data.totals` and `data.rollups[]` with `transaction_count`, `income`, `fees` (USD decimal strings).

## Tax Documentation

Every submission is **immutable** — each POST creates a new record. Two path scopes exist for the same operations:
- **Path-scoped** (tenant token): `/account-owners/{id}/tax-documentation-data/...`
- **Token-scoped** (account-owner token): same paths **without** `/account-owners/{id}` — the account owner is derived from the JWT. These are the variants the React SDK / browser flows use.

| Method | Path                                                                 | Description                      |
| ------ | -------------------------------------------------------------------- | -------------------------------- |
| POST   | `/account-owners/{id}/tax-documentation-data/w-9`                    | Submit W-9                       |
| POST   | `/account-owners/{id}/tax-documentation-data/w-8ben`                 | Submit W-8BEN                    |
| POST   | `/account-owners/{id}/tax-documentation-data/w-8ben-e`               | Submit W-8BEN-E                  |
| POST   | `/account-owners/{id}/tax-documentation-data/self-certification`     | Submit self-certification        |
| GET    | `/account-owners/{id}/tax-documentation-data`                        | Retrieve tax documentation data  |
| GET    | `/account-owners/{id}/tax-documentation-status`                      | Get documentation status         |
| POST   | `/account-owners/{id}/tax-documentation-data/document`               | Generate a PDF document          |
| GET    | `/account-owners/{id}/tax-documentation-data/document/{document-id}` | Retrieve a generated document    |
| GET    | `/tax-documentation-data`, `/tax-documentation-status`, `POST /tax-documentation-data/document` | Token-scoped variants (no `id`) |
| GET    | `/tax-treaty-rates`                                                  | Get tax treaty withholding rates |

All form POSTs return **201** and mirror the submitted body. There is **no W-8IMY submission endpoint** — W-8IMY appears only as a returned type in `GET .../tax-documentation-data` and as a valid `document_type` for PDF generation.

### W-9 Submission

| Field                                | Type    | Description                                                                                                  |
| ------------------------------------ | ------- | ------------------------------------------------------------------------------------------------------------ |
| `name` / `dba_name`                  | string  | Legal name / doing-business-as name                                                                          |
| `tax_classification`                 | enum    | `INDIVIDUAL`, `C_CORPORATION`, `S_CORPORATION`, `PARTNERSHIP`, `TRUST_ESTATE`, `LLC_C`, `LLC_P`, `LLC_S`, `SOLE_PROPRIETOR`, `OTHER` |
| `other_tax_classification`           | string  | Used with `OTHER`                                                                                            |
| `tin` / `tin_type`                   | string / enum | `tin_type`: `SSN`, `EIN`, `ITIN`, `ATIN`                                                              |
| `address`                            | object  | Standard address                                                                                             |
| `exempt_payee_code`                  | enum    | `1`–`13`                                                                                                     |
| `exempt_fatca_code`                  | enum    | `A`–`M`                                                                                                      |
| `is_not_subject_backup_withholding`  | boolean | Defaults `true`                                                                                              |
| `has_signed_and_certified`           | boolean | Certification                                                                                                |
| `signature_timestamp`                | date-time | ISO-8601                                                                                                   |
| `completed_for`                      | enum    | `ACCOUNT_HOLDER` or `REGARDED_OWNER`                                                                         |

### W-8BEN Submission (Non-US Individuals)

Key fields: `name`, `country` (citizenship), `permanent_address`, `mailing_address`, `us_tin`, `ftin`, `date_of_birth`, `ftin_not_legally_required`, `has_signed_and_certified`, `signature_timestamp`, `completed_for`. Treaty claim fields: `treaty_claim_is_eligible`, `treaty_claim_country`, `treaty_claim_i_certify_resident`, `treaty_claim_type_of_income` (`ROYALTIES_OTHER`/`BUSINESS_PROFITS`), `treaty_claim_rate_of_withholding`, `treaty_claim_article_paragraph`, `treaty_claim_has_additional_conditions`. (W-8BEN has no `limitation_on_benefits`.)

### W-8BEN-E Submission (Non-US Entities)

Adds `tax_classification` (enum: `CORPORATION`, `PARTNERSHIP`, `SIMPLE_TRUST`, `COMPLEX_TRUST`, `GRANTOR_TRUST`, `ESTATE`, `CENTRAL_BANK_OF_ISSUE`, `FOREIGN_GOVERNMENT_CONTROLLED_ENTITY`, `FOREIGN_GOVERNMENT_INTEGRAL_PART`, `TAX_EXEMPT_ORGANIZATION`, `PRIVATE_FOUNDATION`, `INTERNATIONAL_ORGANIZATION`) plus all W-8BEN fields and the entity treaty fields `treaty_claim_i_certify_requirements` and `treaty_claim_limitation_on_benefits` (enum: `GOVERNMENT`, `TAX_EXEMPT_PENSION`, `OTHER_TAX_EXEMPT_ORGANIZATION`, `PUBLICLY_TRADED_CORPORATION`, `SUBSIDIARY`, `COMPANY_MEETS_EROSION_TEST`, `COMPANY_MEETS_DERIVATIVE_TEST`, `COMPANY_MEETS_BUSINESS_TEST`, `FAVORABLE_DETERMINATION`, `NO_LOB_ARTICLE`, `OTHER_ARTICLE_PARAGRAPH`).

### Self-Certification Submission (CRS/CARF/DAC8)

| Field                 | Type   | Description                                                                                          |
| --------------------- | ------ | ---------------------------------------------------------------------------------------------------- |
| `name`                | string | Name                                                                                                 |
| `permanent_address` / `mailing_address` | object | Addresses                                                                       |
| `classification`      | enum   | `INDIVIDUAL`, `FINANCIAL_INSTITUTION_DEPOSITORY_INSTITUTION`, `FINANCIAL_INSTITUTION_CUSTODIAL_INSTITUTION`, `FINANCIAL_INSTITUTION_INSURANCE_COMPANY`, `FINANCIAL_INSTITUTION_NON_REPORTING`, `FINANCIAL_INSTITUTION_INVESTMENT_ENTITY_MANAGED`, `FINANCIAL_INSTITUTION_INVESTMENT_ENTITY_OTHER`, `ACTIVE_NFE_GOVERNMENT_ENTITY`, `ACTIVE_NFE_CENTRAL_BANK`, `ACTIVE_NFE_INTERNATIONAL_ORGANIZATION`, `ACTIVE_NFE_PUBLIC_CORPORATION`, `ACTIVE_NFE_OTHER`, `PASSIVE_NFE` |
| `entity_type`         | enum   | `TRUST`, `SIMILAR_TO_TRUST`, `OTHER`                                                                |
| `tax_residences`      | array  | `country`, `tin`, `tin_not_required`, `tin_not_required_reason` (`NOT_ISSUED`/`NOT_REQUIRED`/`OTHER`), `tin_not_required_reason_other` |
| `controlling_persons` | array  | See below                                                                                            |
| `date_of_birth` / `city_of_birth` / `country_of_birth` / `country_of_citizenship` | — | Individual details                                     |
| `giin`                | string | For financial institutions                                                                           |
| `residence_by_investment_confirmed` | boolean | CBI/RBI confirmation                                                                    |
| `signature_capacity`  | enum   | `OWNER`, `AUTHORIZED_SIGNER`, `TRUSTEE`, `EXECUTOR`, `GUARDIAN`, `OTHER`                            |
| `has_signed_and_certified` / `signature_date` | — | Certification                                                              |

**Controlling person fields:** `name`, `address`, `mailing_address`, `date_of_birth`, `city_of_birth`, `country_of_birth`, `country_of_citizenship`, `ownership_percentage`, `residence_by_investment_confirmed`, `tax_residences`, `role` (`SETTLOR`, `TRUSTEE`, `PROTECTOR`, `BENEFICIARY`, `OWNER`, `SENIOR_MANAGING_OFFICIAL`, `OTHER`, `OTHER_MEANS`, plus `_EQUIVALENT` variants).

### Tax Documentation Status Response

Root: `days_since_establishment`, plus per-form sections `w_form_questionnaire`, `dps_questionnaire`, `self_certification`. (`submission_status` and `DAC7_interview` are **deprecated** — use `dps_questionnaire` for DAC7/DPS.)

- `w_form_questionnaire`: `type` (`W-9`/`W-8BEN`/`W-8BEN-E`), `data_collection_status` (`COMPLETE`/`INCOMPLETE`), `tin_status` (`PENDING`, `INVALID_DATA`, `VALID_SSN_MATCH`, `VALID_EIN_MATCH`, `VALID_SSN_EIN_MATCH`, `MISMATCH`, `TIN_NOT_ISSUED`, `ERROR`), `tax_documentation_status` (`VALID`/`INVALID`), `treaty_claim_status`, `expiration_date`, `tin_validation_date`, `needs_resubmission`, `issues[]`.
- `dps_questionnaire`: `vat_status` (`PENDING`, `VALID`, `INVALID`, `INSUFFICIENT_DATA`, `NOT_REQUIRED`, `NON_EU`), plus the common status/expiration/`issues` fields.
- `self_certification`: `tax_documentation_status`, `data_collection_status`, `needs_resubmission`, `issues[]`.

**Issue object:** `issue_type`, `status` (`OPEN`/`IN_REVIEW`/`RESOLVED`), `created_at`, `details`. `issue_type` values: `CHANGE_IN_CIRCUMSTANCES`, `CARE_OF_PERMANENT_ADDRESS`, `PO_BOX_PERMANENT_ADDRESS`, `US_PERMANENT_ADDRESS`, `TREATY_COUNTRY_MISMATCH`, `US_INDICIA`, `WITHHOLDING_DOCUMENTATION`, `INCOMPLETE_ADDRESS`, `INCOMPLETE_DATA`, `INCONSISTENT_DATA`, `INCOMPLETE_CLASSIFICATION`, `INCOMPLETE_US_TIN`, `INCOMPLETE_TREATY_CLAIM`, `INCOMPLETE_GIIN`, `CBI_RBI_CONFIRMATION`. (Curing of open W-8 issues is handled client-side via the React SDK `TaxbitCuringDocumentation` component.)

### Document Generation & Treaty Rates

- `POST .../document` body: `document_type` (`W-9`, `W-8BEN`, `W-8BEN-E`, `W-8IMY`, `SELF_CERTIFICATION`). Returns `id`, `type`, `status` (`PROCESSING`/`FINISHED`/`ERROR`), `url` (present once `FINISHED`). Poll `GET .../document/{document-id}` until `FINISHED`.
- `GET /tax-treaty-rates?country=<name or ISO alpha-2>` (required). Returns `general_rates` (`interest`, `dividends`) and `special_rates` (`interest`, `dividends`, `other_income`, each `{rate, article}`). 1042-S income codes: interest `01`, dividends `06`, other income `23`.
- `GET .../tax-documentation-data` supports `unmask=true` to return unmasked TINs.

## Gains

| Method | Path               | Description                                                                                     |
| ------ | ------------------ | ----------------------------------------------------------------------------------------------- |
| GET    | `/gains`           | All gains — detailed cost bases, proceeds, and gains/losses (IRS Form 8949 / 1099-B line items) |
| GET    | `/gains/breakdown` | Short-term, long-term, and total gains/losses                                                   |
| GET    | `/gains/summary`   | Per-asset gains totals for a specified period                                                   |

Common query params: `account_id`, `start_date`, `end_date` (`breakdown`/`summary` require the dates), `page_size` (max 500 for `/gains`), `continuation_key`. `/gains` also accepts `client_disposition_transaction_id` (up to 25). Optional `x-user-id` header. Reads return `calculation_status` (`in_progress`/`complete`); poll until `complete`. `gain_type` is `long-term`/`short-term`.

## Inventory

| Method | Path                   | Description                                                               |
| ------ | ---------------------- | ------------------------------------------------------------------------- |
| GET    | `/inventory`           | Lots and summary for a single asset (requires `asset_id` or `asset_code`) |
| GET    | `/inventory/summaries` | Summary of total cost and quantity for each undisposed asset              |

`/inventory` params: `account_id`, `asset_id` **or** `asset_code` (required), `offset`, `limit` (default 25), `include_summary` (default true), `price` (for unrealized gain/loss), `lots_ordered_by` (`HIFO`/`FIFO`/`LIFO`/`LOFO`). Lots are sorted by the requested disposition method.

### Transfer Lots

| Method | Path                                           | Description                                                    |
| ------ | ---------------------------------------------- | -------------------------------------------------------------- |
| POST   | `/transfer-lots/transactions/{transaction-id}` | Create transfer lots with cost bases (replaces existing lots)  |
| GET    | `/transfer-lots/transactions/{transaction-id}` | Get transfer lots for a transaction                            |
| DELETE | `/transfer-lots/transactions/{transaction-id}` | Delete transfer lots                                           |
| GET    | `/transfer-lots/transactions`                  | Get transfer lots for multiple transactions (`account_id` + up to 25 `client_transaction_id`) |

POST body: `effective_datetime` (optional), `transfer_lots[]` with `quantity`, `cost_basis` (≥0), `acquisition_transaction_datetime`.

## Disposition Methods

| Method | Path                                                      | Description                               |
| ------ | --------------------------------------------------------- | ----------------------------------------- |
| POST   | `/accounts/{id}/disposition-methods/history`              | Create disposition methods for an account |
| PATCH  | `/accounts/{id}/disposition-methods/history/{history-id}` | Update a disposition method record        |
| DELETE | `/accounts/{id}/disposition-methods/history/{history-id}` | Delete a disposition method record        |
| GET    | `/accounts/{id}/disposition-methods/history`              | Get disposition methods for an account    |
| GET    | `/filers/{id}/disposition-methods/history`                | Get disposition methods for a filer       |

Body/response items: `disposition_method` (`HIFO`/`FIFO`/`LIFO`/`LOFO`), `effective_datetime`, `id`. POST returns **201**.

## Form Items

| Method | Path                                         | Description                                                         |
| ------ | -------------------------------------------- | ------------------------------------------------------------------- |
| GET    | `/users/{user-id}/form-items/{form-item-id}` | Get a form item                                                     |
| PUT    | `/users/{user-id}/form-items/{form-item-id}` | Upsert a form item                                                  |
| DELETE | `/users/{user-id}/form-items/{form-item-id}` | Delete a form item                                                  |
| POST   | `/form-items/batch`                          | Upsert a collection of form items (max 100)                         |
| GET    | `/users/{user-id}/form-items`                | Get all form items for a user within a tax year                     |
| GET    | `/form-items/aggregates/{document-type}`     | Aggregates by document type (only `1099_B`)                         |

- `GET /users/{user-id}/form-items` requires `tax_year` and `document_type` (`1099_B`, `1099_INT`, `1099_DIV`, `1099_DA`, `1099_MISC`, `1099_NEC`, `1099_K`, `1099_R`, `5498`); `1099_B` supports `continuation_key`.
- `POST /form-items/batch` returns `{ successes[], failures[] }` (no `data` envelope).
- `GET /form-items/aggregates/1099_B` returns `record_count`, `proceeds`, `cost_basis`; optional date-range params.

## Documents

| Method | Path                           | Description                                                                     |
| ------ | ------------------------------ | ------------------------------------------------------------------------------- |
| GET    | `/accounts/{id}/tax-documents` | Get released tax documents for an account (latest of each type/year by default) |

Query params: `include_historical` (default false), `url_expiration_time` (seconds, default 600, max 3600). Each document has `id`, `type` (`GAIN_LOSS_SUMMARY`, `1042_S`, `1099_DA`, `1099_B`, `1099_DIV`, `1099_INT`, `1099_K`, `1099_MISC`, `1099_NEC`, `1099_R`, `5498`, `RMD_STATEMENT`, `TRANSACTION_SUMMARY`, `UK_GAIN_LOSS_SUMMARY`, `DAC7`, plus `_PDF` variants), `year`, `revision`, `revision_type` (`ORIGINAL`/`CORRECTION`/`VOID`), `created_date`, `url`, `is_filed`.

## Reports

Asynchronous bulk report generation. Trigger a report, poll for completion, then download from a pre-signed URL.

| Method | Path                                       | Description                          |
| ------ | ------------------------------------------ | ------------------------------------ |
| POST   | `/reports/inventory-summary`               | Trigger an inventory summary report  |
| GET    | `/reports/inventory-summary/{reportId}`    | Poll status / get the download URL   |

- POST body: `as_of_timestamp` (ISO-8601 UTC, **required**), `account_ids` (optional array, max 10,000; omit for all accounts). Returns **202** with `report_id` and `status: "pending"`.
- GET returns `status` (`pending`/`processing`/`completed`/`failed`); when `completed`, includes `download_url` (pre-signed, valid **15 minutes** — re-GET for a fresh one), `completed_at`, `expires_at`, and `metadata`. Reports are retained **30 days**.

## Filers

A filer is the legal entity responsible for filing tax forms with tax authorities. Tenants may have multiple filers, one marked `is_default: true`. (Filers replace the former "Payers" concept — Payers endpoints no longer exist.) Only `name` is required to create one; other fields are needed to generate specific form types.

| Method | Path            | Description      | Success |
| ------ | --------------- | ---------------- | ------- |
| POST   | `/filers`       | Create a filer   | 201     |
| GET    | `/filers`       | Get all filers   | 200     |
| GET    | `/filers/{id}`  | Get a filer      | 200     |
| PATCH  | `/filers/{id}`  | Update a filer   | 200     |
| DELETE | `/filers/{id}`  | Delete a filer   | 204     |

`DELETE` returns **409** if the filer is the default or has associated accounts.

**Create/Update fields:**

| Field                          | Type    | Required | Description                                                                              |
| ------------------------------ | ------- | -------- | ---------------------------------------------------------------------------------------- |
| `name`                         | string  | Yes      | Legal name of the filer                                                                  |
| `address`                      | object  | No       | Standard address                                                                         |
| `ein` / `tin`                  | string  | No       | Employer / Taxpayer Identification Number                                                 |
| `tax_country_code`             | string  | No       | ISO 3166-1 alpha-2                                                                        |
| `vat_id` / `vat_country`       | string  | No       | VAT registration (`vat_id` returned masked as `vat_id_masked`)                           |
| `contact_name` / `contact_title` / `contact_email` / `contact_phone` | string | No | Contact details (phone in E.164)                     |
| `giin`                         | string  | No       | Global Intermediary Identification Number                                                |
| `arn`                          | string  | No       | ATO Reference Number (12 numeric digits)                                                 |
| `rtn`                          | string  | No       | Routing Transit Number                                                                   |
| `disposition_method`           | enum    | No       | `HIFO`, `FIFO`, `LIFO`, `LOFO` (defaults to `FIFO`)                                     |
| `form_1099_k_filer_type`       | enum    | No       | `PAYMENT_SETTLEMENT_ENTITY`, `ELECTRONIC_PAYMENT_FACILITATOR_OR_OTHER_THIRD_PARTY`       |
| `form_1099_k_transaction_type` | enum    | No       | `PAYMENT_CARD_TRANSACTIONS`, `THIRD_PARTY_NETWORK_TRANSACTIONS`                          |
| `form_1042_s_chapter_3_status` | enum    | No       | Chapter 3 withholding status (25 values — see docs)                                      |
| `form_1042_s_chapter_4_status` | enum    | No       | Chapter 4 (FATCA) status (38 values — see docs)                                          |
| `cesop_psp_ids`                | array   | No       | CESOP PSP identifiers (`psp_id`, `country`, `description`)                                |
| `cra_account_number`           | string  | No       | Canada Revenue Agency account number                                                     |
| `cra_account_number_type`      | enum    | No       | `BN9`, `BN15`, `Trust`, `NR4`                                                            |
| `cra_representative_identifier`| string  | No       | 7 alphanumeric characters                                                                |
| `pse_name` / `pse_telephone_number` | string | No  | Payment Settlement Entity details                                                        |
| `dac7_receiving_member_state`  | enum    | No       | EU member state code (27 values: AT, BE, BG, HR, CY, CZ, DK, EE, FI, FR, DE, GR, HU, IE, IT, LV, LT, LU, MT, NL, PL, PT, RO, SK, SI, ES, SE) |

**Response** includes all submitted fields plus system-generated: `id` (UUID), `tenant_id` (UUID), `date_created`, `date_modified`, `is_default`, `vat_id_masked`.

## Real-Time TIN Validation

| Method | Path                                  | Description                |
| ------ | ------------------------------------- | -------------------------- |
| POST   | `/validations/us-tin`                 | Validate a US TIN and name |
| GET    | `/validations/us-tin/{validation_id}` | Get validation results     |

- POST body: `tin`, `legal_name` (both required). Query `use_async` (`"true"`/`"false"`, default false) — when true, returns `PENDING` immediately.
- GET query: `unmask_tin` (`"true"`/`"false"`, default false).
- Response: `id`, `legal_name`, `tin` (masked), `status`, `validation_date`. `status` values: `PENDING`, `VALID_SSN_MATCH`, `VALID_EIN_MATCH`, `VALID_SSN_EIN_MATCH`, `MISMATCH`, `TIN_NOT_ISSUED`.

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
