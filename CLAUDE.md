# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

An agent skills package that provides two skills for integrating with the Taxbit platform. Compatible with Claude Code (as a plugin) and 40+ other AI agents via the [Skills CLI](https://skills.sh):

- **`taxbit:api`** (`skills/api/SKILL.md`) — REST API integration guidance (authentication, endpoints, webhooks, error handling)
- **`taxbit:react-sdk`** (`skills/react-sdk/SKILL.md`) — React SDK integration for tax form collection and W-8 curing (`@taxbit/react-sdk`)

## Plugin Structure

```
CLAUDE.md                            # This file — instructions for regenerating content
plugin.json                          # Plugin manifest (name: "taxbit")
.claude-plugin/marketplace.json      # Marketplace manifest (name: "taxbit-skills")
README.md                            # User-facing documentation
skills/
  api/SKILL.md                       # Taxbit REST API skill
  react-sdk/SKILL.md                 # Taxbit React SDK skill
```

## How Skills Work

Each `SKILL.md` has YAML frontmatter (`name`, `description`, `allowed-tools`) followed by markdown instructions that Claude receives when the skill is invoked. Claude auto-invokes skills when their `description` matches the user's task, or users invoke them manually via `/taxbit:api` or `/taxbit:react-sdk`.

## Installation

### Any Agent (via Skills CLI)
```
npx skills add taxbit-shared/taxbit-skills
```

### Claude Code Only
```
/plugin marketplace add git@github.com:taxbit-shared/taxbit-skills.git
/plugin install taxbit@taxbit-skills
```

## Content Generation

All content in `skills/api/SKILL.md`, `skills/react-sdk/SKILL.md`, and `README.md` is AI-generated from the Taxbit documentation. No single developer is responsible for authoring these files. When updating, always regenerate from the source docs rather than hand-editing.

### How to Regenerate the API Skill (`skills/api/SKILL.md`)

1. **Start from the machine-readable index: `https://apidocs.taxbit.com/llms.txt`** — it lists every guide and every reference endpoint (method + path) with `.md` URLs. Note: it no longer lists changelogs, and `https://apidocs.taxbit.com/changelog` returns 404 — there is currently no changelog to diff against, so compare the `llms.txt` endpoint inventory against the skill's existing endpoint tables to find what's new. Append `.md` to any reference/docs URL to fetch clean markdown instead of the SPA. Prefer the `.md` pages over the HTML reference. Note: the endpoint *paths* shown in `llms.txt` are sometimes slugified and inaccurate (e.g. it renders `/inventory/summaries` as `inventory-summaries` and `/accounts/{id}/disposition-methods/history` as `disposition-methods-history`) — always confirm the true path from the individual endpoint `.md` page.
2. Fetch each individual endpoint page to get request/response schemas, field types, enums, and examples. Because there are 60+ endpoints, fanning the fetches out across parallel subagents (grouped by resource) is the efficient approach. Key pages include:
   - Auth: `reference/post_oauth-token.md`, `reference/post_oauth-account-owner-token.md` (bodies are JSON; account-owner token now takes `id`, with `account_owner_id` deprecated)
   - Account Owners: `reference/post_account-owners.md`, `reference/patch_account-owners-id.md`, `reference/get_account-owners-id.md`, `reference/get_account-owners-id-us-tin-validation-status.md` (note `us_tax_classification`, `fatca_classification`, `tax_residencies`, `controlling_persons`, `us_tin`/`us_tin_type`)
   - Tax Documentation: `reference/post_account-owners-id-tax-documentation-data-w-9.md`, `...-w-8ben.md`, `...-w-8ben-e.md`, `...-self-certification.md`, `reference/get_account-owners-id-tax-documentation-data.md`, `reference/get_account-owners-id-tax-documentation-status.md`, `reference/post_account-owners-id-tax-documentation-data-document.md`, `reference/get_account-owners-id-tax-documentation-data-document-document-id.md`. Also the **account-owner-token-scoped variants** (no `/account-owners/{id}`): `reference/get_tax-documentation-data.md`, `reference/get_tax-documentation-status-3.md`, `reference/post_tax-documentation-data-document.md`. **W-8IMY now HAS a submission endpoint**: `POST /v1/account-owners/{id}/tax-documentation-data/w-8imy`, documented at `reference/taxdocumentationcontroller_submitw8imy.md` (note the non-standard page slug). Earlier revisions of this file wrongly stated no such endpoint existed.
   - Accounts: `reference/post_accounts.md`, `reference/patch_accounts-id.md`, `reference/get_accounts-id.md`
   - Transactions: `reference/post_transactions-external-id.md` (static path — external id goes in the body as `id`), `reference/get_transactions-external-id-id-1.md`, `reference/delete_transactions-external-id-id-1.md`, `reference/get_accounts-id-transactions.md`, `reference/transaction-data-model-current.md` (full transaction object structure)
   - Aggregations: `reference/get_accounts-id-income.md`
   - Form Items: `reference/post_form-items-batch.md`, `reference/get_users-user-id-form-items.md`, `reference/get_form-items-aggregates-document-type.md`, plus the single-item operations `reference/get_users-user-id-form-items-form-item-id.md`, `reference/put_users-user-id-form-items-form-item-id.md`, `reference/delete_users-user-id-form-items-form-item-id.md`
   - Documents: `reference/get_accounts-id-tax-documents.md`
   - Reports (async bulk): `reference/reports.md`, `reference/post_reports-inventory-summary.md` (+ the `GET /reports/inventory-summary/{reportId}` status/download companion)
   - Gains: `reference/get_gains.md`, `reference/get_gains-breakdown.md`, `reference/get_gains-summary.md`
   - Inventory: `reference/get_inventory.md`, `reference/get_inventory-summaries.md`
   - Transfer Lots: `reference/post_transfer-lots-transactions-transaction-id.md`, `reference/get_transfer-lots-transactions-transaction-id.md`, `reference/delete_transfer-lots-transactions-transaction-id.md`, `reference/get_transfer-lots-transactions.md`
   - Disposition Methods: `reference/post_accounts-id-disposition-methods-history.md`, `reference/patch_accounts-id-disposition-methods-history-history-id.md`, `reference/delete_accounts-id-disposition-methods-history-history-id.md`, `reference/get_accounts-id-disposition-methods-history.md`, `reference/get_filers-id-disposition-methods-history.md`
   - TIN Validation: `reference/post_validations-us-tin.md`, `reference/get_validations-us-tin-validation-id.md`
   - Filers (full CRUD): `reference/post_filers.md`, `reference/get_filers.md`, `reference/get_filers-id.md`, `reference/patch_filers-id.md`, `reference/delete_filers-id.md`
   - Treaty Rates: `reference/get_tax-treaty-rates.md`
   - Withholding (Austria KESt): `reference/withholding.md`, `reference/get_austria-withholding.md`, plus the Austria guide set `docs/austria-overview.md`, `docs/austria-real-time-calculation.md`, `docs/austria-responsibility-matrix.md`, `docs/austria-integration-flow.md`, `docs/austria-important-considerations.md`, `docs/austria-glossary.md`. Applies to accounts on the `austria` disposition method.
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
   - `https://apidocs.taxbit.com/docs/reading-curing-statuses.md`
   - `https://apidocs.taxbit.com/docs/remediation-faq.md`
   - `https://apidocs.taxbit.com/docs/curing-documentation.md`
   - `https://apidocs.taxbit.com/docs/how-the-sdk-works.md`
   - Check the latest version with `npm view @taxbit/react-sdk version` (and `dist-tags`) — the `latest` tag is the version to document (was `5.0.0` at last regen; the `beta` tag lags far behind `latest` and should be ignored).
   - **Trust the package's bundled `.d.ts` files over the web docs.** The apidocs pages lag the published package; when they disagree, the type declarations in `dist/src/` win.
2. Write the skill file with this structure:
   - YAML frontmatter: `name: react-sdk`, `description` (trigger conditions), `allowed-tools` (Read, Grep, Glob, Bash, Write, Edit, WebFetch)
   - Role statement: "You are a Taxbit React SDK integration assistant..."
   - Package info (npm name, latest version, install command, React/TypeScript compatibility)
   - Exports list, Quick Start (demo mode + production) with CSS import
   - Questionnaire types table — `QuestionnaireProp` is `'W-FORM' | 'DPS' | 'SELF-CERT' | 'RESIDENCIES'` (W-FORM covers W-8IMY). The package also exports the `ALL_QUESTIONNAIRES` const.
   - Authentication section explaining account-owner-scoped tokens (server-side only) + token-expiration remount (`key`) pattern
   - Full `TaxbitQuestionnaire` props table (incl. `prepopulateWithSavedData`, `region`, `proxyDomain`, `proxyHeaders`)
   - Adaptive Mode section with modes (`full`, `skipLock`, `skipEdit`), data rules, and example
   - `useTaxbit` hook section (return fields incl. `needsCuringDocumentation`, `isLoading`, `refresh*`), status shape, TIN/VAT validation statuses
   - Curing section: `TaxbitCuringDocumentation` component, curable issue types, reasonable-explanation flow, demo/region/proxy modes
   - `onProgress` callback with `Progress` type definition and step IDs
   - **CSS / Styling & Customization** — regenerate from the bundled stylesheets, not the web docs (see step 3 below). Supported languages (50+ locales), CSP, Demo Mode, Security, common integration patterns
   - Links to full docs
3. **Regenerate the styling section from two sources** (the apidocs site does not document styling):
   - **Bundled CSS** (`package/style/*.css`) tells you which classes are actually *styled* and their default values:
   ```
   npm pack @taxbit/react-sdk@<version>
   tar -xzf taxbit-react-sdk-*.tgz
   ls package/style/                              # inline.css, basic.css, minimal.css, index.css
   # NOTE: index.css ships in style/ but is NOT listed in package.json "exports", so it is not importable by subpath
   grep -rhoE "taxbit-[a-z-]+" package/style/*.css | sort -u   # styled classes only
   diff package/style/basic.css package/style/inline.css       # how the variants differ
   ```
   - **SDK component source** (the `tax-documentation` monorepo, `packages/react-sdk/`) is the authoritative list of *overridable* classes — it includes structural wrappers exposed as hooks but **not** styled by the bundled CSS (e.g. `.taxbit-page-main`, `.taxbit-section-content`, the whole `.taxbit-address` composite, date selects, `.taxbit-row-edit-button`, `.taxbit-spinner-icon`), so `grep`-ing the CSS alone undercounts. When the SDK team provides an updated class map, prefer it over the CSS-derived list.
   - Frame the section around the **key facts that keep an AI accurate**: (a) the CSS is minimal/hand-written/unopinionated and customers are **not** expected to keep it — the stable `taxbit-*` class structure is the real asset; (b) **there are NO CSS custom properties / `--taxbit-*` variables** — all customization is class overrides (an AI will otherwise hallucinate theming variables); (c) importing a base stylesheet is optional (`minimal.css` or none is a legitimate, common starting point).
   - Include the **full class reference table** grouped by DOM nesting (root/page chrome, sections, field rows, form controls, address composite, buttons, status/messages/badges, state modifiers), the hardcoded default values (only relevant when tweaking a kept base), a specificity note (buttons use element-qualified + nested selectors like `.taxbit-primary-actions > button`), and 2–3 override examples.
   - **Do NOT trust the SDK's own bundled `CHANGELOG.md` for CSS changes.** The 5.0.0 changelog carries a "CSS class names / DOM structure" breaking-change table that is *not* relative to 4.x — those renames (`taxbit-check-box`→`taxbit-checkbox`, `taxbit-section-title` removed, etc.) actually happened in 3.7.0 → 4.0.0. Verified: all four stylesheets and the full 62-token `taxbit-*` set are byte-identical across 4.0.0, 4.1.0 and 5.0.0. Always diff the extracted class tokens between the two tarballs rather than believing the changelog.
   - **The `taxbit-address-line-1` / `-line-2` / `-region` / `-country` classes do not exist** in any bundle. They were documented in error. Address subfield classes are generated at runtime from the field key via `` `taxbit-${key}` `` (producing e.g. `taxbit-city`, `taxbit-postal-code`), so document the *rule*, not a fixed list.
   - Document the **dynamic class families** as a *naming rule*, not an enum: `.taxbit-form-<form-name>`, `.taxbit-question-<field-name>`, `.taxbit-error-message-<field-name>` are generated by kebab-casing the form/field key (e.g. W-8BEN-E → `.taxbit-form-w-8ben-e`, TIN field → `.taxbit-question-tin`). Flag the caveat that some `taxbit-error-*` tokens (e.g. `taxbit-error-dob`) are DOM **`id`s** for `aria-describedby`, not CSS classes — do not document them as override targets.

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

- **Two focused skills, not one**: API (server-side REST) and React SDK (client-side questionnaire widgets) are separate skills because they serve different contexts and packages. This keeps each skill focused and avoids loading irrelevant content. The `description` fields ensure the agent picks the right one.
- **`@taxbit/utilities` is deliberately NOT documented here.** It is an internal dependency of the React SDK, not a supported public surface for customers, so this package must not advertise its lookups, validators, or types. Mention the SDK's re-exported types (`ClientTaxDocumentation`, `ClientTaxResidency`) only as imports from `@taxbit/react-sdk`, never by pointing readers at `@taxbit/utilities` directly. A `skills/utilities/SKILL.md` existed through 0.3.0 and was removed in 0.4.0; do not reintroduce it.
- **Comprehensive inline docs**: Skills contain full endpoint/prop details rather than just linking to external docs. This is because Claude needs the information in its context window to generate accurate code. External links are provided as supplementary references.
- **Enum values included**: All enum values (disposition methods, TIN types, classifications, etc.) are listed inline so Claude can generate valid API payloads without guessing.
- **Both token types documented**: The API skill documents both tenant-scoped and account-owner-scoped tokens because developers frequently confuse which to use. The React SDK skill also covers the account-owner token since it's required for the SDK.
- **`allowed-tools` includes WebFetch**: Both skills include WebFetch so Claude can check the live docs if a developer asks about something not covered in the skill content.
- **Marketplace structure**: The `.claude-plugin/marketplace.json` with an `owner` field is required for the plugin to be installable via `/plugin marketplace add`. The `source: "./"` points to the plugin.json at the repo root.
- **Cross-agent compatibility**: The `SKILL.md` format is compatible with both Claude Code plugins and the Vercel Skills ecosystem (`npx skills add`). The `allowed-tools` frontmatter is Claude-specific and ignored by other agents. No changes are needed to support both install methods.
- **Two install methods, complementary**: `npx skills add` installs to `.claude/skills/` (and 41 other agent directories) for project-level auto-invocation. The Claude Code plugin install adds `/taxbit:api` and `/taxbit:react-sdk` slash commands. Both can coexist without conflict.
