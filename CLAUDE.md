# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

An agent skills package that provides three skills for integrating with the Taxbit platform. Compatible with Claude Code (as a plugin) and 40+ other AI agents via the [Skills CLI](https://skills.sh):

- **`taxbit:api`** (`skills/api/SKILL.md`) — REST API integration guidance (authentication, endpoints, webhooks, error handling)
- **`taxbit:react-sdk`** (`skills/react-sdk/SKILL.md`) — React SDK integration for tax form collection and W-8 curing (`@taxbit/react-sdk`)
- **`taxbit:utilities`** (`skills/utilities/SKILL.md`) — the `@taxbit/utilities` toolkit (lookups, validators, error messages, type guards, types, case converters)

## Plugin Structure

```
CLAUDE.md                            # This file — instructions for regenerating content
plugin.json                          # Plugin manifest (name: "taxbit")
.claude-plugin/marketplace.json      # Marketplace manifest (name: "taxbit-plugins")
README.md                            # User-facing documentation
skills/
  api/SKILL.md                       # Taxbit REST API skill
  react-sdk/SKILL.md                 # Taxbit React SDK skill
  utilities/SKILL.md                 # Taxbit Utilities (@taxbit/utilities) skill
```

## How Skills Work

Each `SKILL.md` has YAML frontmatter (`name`, `description`, `allowed-tools`) followed by markdown instructions that Claude receives when the skill is invoked. Claude auto-invokes skills when their `description` matches the user's task, or users invoke them manually via `/taxbit:api`, `/taxbit:react-sdk`, or `/taxbit:utilities`.

## Installation

### Any Agent (via Skills CLI)
```
npx skills add taxbit-shared/taxbit-skills
```

### Claude Code Only
```
/plugin marketplace add git@github.com:taxbit-shared/taxbit-skills.git
/plugin install taxbit@taxbit-plugins
```

## Content Generation

All content in `skills/api/SKILL.md`, `skills/react-sdk/SKILL.md`, and `README.md` is AI-generated from the Taxbit documentation. No single developer is responsible for authoring these files. When updating, always regenerate from the source docs rather than hand-editing.

### How to Regenerate the API Skill (`skills/api/SKILL.md`)

1. **Start from the machine-readable index: `https://apidocs.taxbit.com/llms.txt`** — it lists every guide, every reference endpoint (method + path), and every changelog with `.md` URLs. Append `.md` to any reference/docs URL to fetch clean markdown instead of the SPA. Prefer the `.md` pages over the HTML reference. Note: the endpoint *paths* shown in `llms.txt` are sometimes slugified and inaccurate (e.g. it renders `/inventory/summaries` as `inventory-summaries` and `/accounts/{id}/disposition-methods/history` as `disposition-methods-history`) — always confirm the true path from the individual endpoint `.md` page.
2. Fetch each individual endpoint page to get request/response schemas, field types, enums, and examples. Because there are 60+ endpoints, fanning the fetches out across parallel subagents (grouped by resource) is the efficient approach. Key pages include:
   - Auth: `reference/post_oauth-token.md`, `reference/post_oauth-account-owner-token.md` (bodies are JSON; account-owner token now takes `id`, with `account_owner_id` deprecated)
   - Account Owners: `reference/post_account-owners.md`, `reference/patch_account-owners-id.md`, `reference/get_account-owners-id-us-tin-validation-status.md` (note `us_tax_classification`, `fatca_classification`, `tax_residencies`, `controlling_persons`, `us_tin`/`us_tin_type`)
   - Tax Documentation: `reference/post_account-owners-id-tax-documentation-data-w-9.md`, `...-w-8ben.md`, `...-w-8ben-e.md`, `...-self-certification.md`, `reference/get_account-owners-id-tax-documentation-data.md`, `reference/get_account-owners-id-tax-documentation-status.md`, `reference/post_account-owners-id-tax-documentation-data-document.md`, `reference/get_account-owners-id-tax-documentation-data-document-document-id.md`. Also the **account-owner-token-scoped variants** (no `/account-owners/{id}`): `reference/get_tax-documentation-data.md`, `reference/get_tax-documentation-status-3.md`, `reference/post_tax-documentation-data-document.md`. (W-8IMY appears only in GET data / PDF generation — there is no W-8IMY submission endpoint.)
   - Accounts: `reference/post_accounts.md`, `reference/patch_accounts-id.md`, `reference/get_accounts-id.md`
   - Transactions: `reference/post_transactions-external-id.md` (static path — external id goes in the body as `id`), `reference/get_accounts-id-transactions.md`
   - Aggregations: `reference/get_accounts-id-income.md`
   - Form Items: `reference/post_form-items-batch.md`, `reference/get_users-user-id-form-items.md`, `reference/get_form-items-aggregates-document-type.md`
   - Documents: `reference/get_accounts-id-tax-documents.md`
   - Reports (async bulk): `reference/reports.md`, `reference/post_reports-inventory-summary.md` (+ the `GET /reports/inventory-summary/{reportId}` status/download companion)
   - Gains: `reference/get_gains.md`, `reference/get_gains-breakdown.md`, `reference/get_gains-summary.md`
   - Inventory: `reference/get_inventory.md`, `reference/get_inventory-summaries.md`
   - Transfer Lots: `reference/post_transfer-lots-transactions-transaction-id.md`, `reference/get_transfer-lots-transactions.md`
   - Disposition Methods: `reference/post_accounts-id-disposition-methods-history.md`, `reference/get_filers-id-disposition-methods-history.md`
   - TIN Validation: `reference/post_validations-us-tin.md`, `reference/get_validations-us-tin-validation-id.md`
   - Filers (full CRUD): `reference/post_filers.md`, `reference/get_filers.md`, `reference/get_filers-id.md`, `reference/patch_filers-id.md`, `reference/delete_filers-id.md`
   - Treaty Rates: `reference/get_tax-treaty-rates.md`
   - Webhooks: `docs/webhooks-guide.md` (event types, `x-taxbit-signature` HMAC-SHA256 verification, retries)
   - **Payers no longer exists** — the old `/tenants/{tenant-id}/payers` endpoint 404s; Filers superseded it. Do not add a Payers section.
3. Write the skill file with this structure:
   - YAML frontmatter: `name: api`, `description` (trigger conditions), `allowed-tools` (Read, Grep, Glob, Bash, Write, Edit, WebFetch)
   - Role statement: "You are a Taxbit API integration assistant..."
   - API Overview with bullet list of resource categories
   - Base URLs (US/multi, EU, staging)
   - Authentication section covering both token types (tenant-scoped and account-owner-scoped) with request/response examples
   - One section per resource with endpoint table (Method | Path | Description) and key request/response fields with types and enums
   - Reports, Webhooks, Rate Limits, Error Handling (status codes + response format), Security, Integration Patterns
   - Links to full reference, guides, and `llms.txt`

### How to Regenerate the React SDK Skill (`skills/react-sdk/SKILL.md`)

1. Fetch the SDK docs (append `.md` for clean markdown):
   - `https://apidocs.taxbit.com/docs/integration-guide.md`
   - `https://apidocs.taxbit.com/docs/component-and-hook-reference.md` (authoritative props/hook/type reference)
   - `https://apidocs.taxbit.com/docs/curing-integration-guide.md`
   - `https://apidocs.taxbit.com/docs/handling-token-expiration.md`
   - `https://apidocs.taxbit.com/docs/tax-documentation-guide.md`
   - Check the latest version with `npm view @taxbit/react-sdk version` (and `dist-tags`) — the `latest` tag is the version to document (was `4.0.0` at last regen; the `beta` tag may lag behind `latest`).
2. Write the skill file with this structure:
   - YAML frontmatter: `name: react-sdk`, `description` (trigger conditions), `allowed-tools` (Read, Grep, Glob, Bash, Write, Edit, WebFetch)
   - Role statement: "You are a Taxbit React SDK integration assistant..."
   - Package info (npm name, latest version, install command, React/TypeScript compatibility)
   - Exports list, Quick Start (demo mode + production) with CSS import
   - Questionnaire types table (`W-FORM` incl. W-8IMY, `DPS`, `SELF-CERT`)
   - Authentication section explaining account-owner-scoped tokens (server-side only) + token-expiration remount (`key`) pattern
   - Full `TaxbitQuestionnaire` props table (incl. `prepopulateWithSavedData`, `region`, `proxyDomain`, `proxyHeaders`)
   - Adaptive Mode section with modes (`full`, `skipLock`, `skipEdit`), data rules, and example
   - `useTaxbit` hook section (return fields incl. `needsCuringDocumentation`, `isLoading`, `refresh*`), status shape, TIN/VAT validation statuses
   - Curing section: `TaxbitCuringDocumentation` component, curable issue types, reasonable-explanation flow, demo/region/proxy modes
   - `onProgress` callback with `Progress` type definition and step IDs
   - CSS/styling, Supported languages (50+ locales), CSP, Demo Mode, Security, common integration patterns
   - Links to full docs

### How to Regenerate the Utilities Skill (`skills/utilities/SKILL.md`)

`@taxbit/utilities` is not covered by the apidocs site — the source of truth is the **package's bundled type definitions**, not the web docs.

1. Check the latest version: `npm view @taxbit/utilities version`.
2. Download and inspect the package's type declarations (do this in a scratch dir, not the repo):
   ```
   npm pack @taxbit/utilities@<version>
   tar -xzf taxbit-utilities-*.tgz
   ```
   - The public surface is `package/dist/index.d.ts` → `./src` barrels: `errorMessages`, `lookups`, `types`, `validationReports`, `validations`, plus `camelCaseKeys`/`snakeCaseKeys`.
   - Enumerate every exported identifier: `grep -rhoE "export (declare )?(const|function|type|interface|enum|class) [A-Za-z0-9_]+" package/dist/src --include="*.d.ts" | sort -u`.
   - Read individual `.d.ts` files for exact lookup tuple values (e.g. `exemptPayeeCodes`, `limitationOnBenefits`, `signatureCapacities`) and validator/error-message signatures.
   - **Do NOT document the `validationReports` barrel** (the ~67 `get*ValidationReport` builders and the `ValidationReport` class). They validate Taxbit-specific tax-documentation types, are backend-only, and are being broken out of the package — deliberately omitted from the skill. By contrast, the customer-facing exports that DO stay take generic inputs and are reused across projects: the field-level `validations` (e.g. `isValidUsTin`, `isCorrectGiinFormat`), `errorMessages`, `lookups`, `types`, the `is*TaxDocumentation` type guards, the `assertVerified*` helpers with `ValidationError`/`ValidationIssue`, and the case converters.
3. Write the skill grouped by category: package info, lookups (option lists with values), format validators, error-message helpers, tax-documentation type guards & types, case converters, treaty helpers, a Security section (PII caution — no secrets/network), common patterns, and links.
4. Because the surface is large (~400 exports), document categories + high-use members with exact values, and tell the reader to inspect `node_modules/@taxbit/utilities/dist/index.d.ts` for anything not listed. Note the `Questionnaire` type uses `SELF_CERTIFICATION` (underscore) vs. the React SDK's `"SELF-CERT"` prop.

Note: the React SDK re-exports `ClientTaxDocumentation` and `ClientTaxResidency` from `@taxbit/utilities`, and also exports the `TaxbitTaxResidencies` widget plus the `Region`/`Locale`/`Progress`/`ClientTaxDocumentationStatus` types — confirm these against `@taxbit/react-sdk`'s `dist/src/index.d.ts` when regenerating the react-sdk skill.

### How to Regenerate the README

The README should be a brief user-facing document with:
- Title and one-line description linking to Claude Code and Taxbit
- Skills table (Skill | Command | Description)
- Note about auto-invocation
- Installation instructions (Skills CLI for any agent, Claude Code plugin for Claude-specific)
- Project structure tree
- Links to Taxbit API docs and Claude Code docs

## Versioning

When tagging a new version:
1. Move entries from `[Unreleased]` in `CHANGELOG.md` to a new version heading
2. Update `version` in `plugin.json` to match
3. These two must always be in sync

## Changelog

Maintain `CHANGELOG.md` using [Keep a Changelog](https://keepachangelog.com) format. Use sections like Added, Changed, Removed, Fixed. New work goes under `## [Unreleased]` until a version is tagged.

Example format:
```
## [Unreleased]

### Added
- Description of change
```

## Design Decisions

- **Three focused skills, not one**: API (server-side REST), React SDK (client-side questionnaire widgets), and Utilities (`@taxbit/utilities` — framework-agnostic lookups/validators/types) are separate skills because they serve different contexts and packages. This keeps each skill focused and avoids loading irrelevant content. The `description` fields ensure Claude picks the right one; the react-sdk and utilities descriptions cross-reference each other since they're commonly used together.
- **Comprehensive inline docs**: Skills contain full endpoint/prop details rather than just linking to external docs. This is because Claude needs the information in its context window to generate accurate code. External links are provided as supplementary references.
- **Enum values included**: All enum values (disposition methods, TIN types, classifications, etc.) are listed inline so Claude can generate valid API payloads without guessing.
- **Both token types documented**: The API skill documents both tenant-scoped and account-owner-scoped tokens because developers frequently confuse which to use. The React SDK skill also covers the account-owner token since it's required for the SDK.
- **`allowed-tools` includes WebFetch**: Both skills include WebFetch so Claude can check the live docs if a developer asks about something not covered in the skill content.
- **Marketplace structure**: The `.claude-plugin/marketplace.json` with an `owner` field is required for the plugin to be installable via `/plugin marketplace add`. The `source: "./"` points to the plugin.json at the repo root.
- **Cross-agent compatibility**: The `SKILL.md` format is compatible with both Claude Code plugins and the Vercel Skills ecosystem (`npx skills add`). The `allowed-tools` frontmatter is Claude-specific and ignored by other agents. No changes are needed to support both install methods.
- **Two install methods, complementary**: `npx skills add` installs to `.claude/skills/` (and 41 other agent directories) for project-level auto-invocation. The Claude Code plugin install adds `/taxbit:api` and `/taxbit:react-sdk` slash commands. Both can coexist without conflict.
