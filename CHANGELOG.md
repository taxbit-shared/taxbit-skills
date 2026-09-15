# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [0.4.0] - 2026-09-15

### Added
- Cross-agent support via Vercel Skills CLI (`npx skills add taxbit-shared/taxbit-skills`) — works with 42 agents including Cursor, GitHub Copilot, Windsurf, and more
- Install method comparison table in README
- **React SDK:** expanded "CSS / Styling & Customization" section — full `taxbit-*` class reference (authoritative SDK class map grouped by DOM nesting: root/page chrome, sections, field rows, form controls, address composite, buttons, status/messages/badges, state modifiers), the dynamic class families (`taxbit-form-*`/`taxbit-question-*`/`taxbit-error-message-*`) documented as a kebab-case naming rule with the aria-`id` caveat, the "no CSS variables, override the classes" contract, the four bundled stylesheets (incl. the previously-undocumented `index.css`), default design tokens, a specificity note, and override examples. Emphasizes that the shipped CSS is minimal/unopinionated and meant to be replaced.
- **CLAUDE.md:** regeneration recipe for the styling section, sourced from both the package's bundled `style/*.css` (styled classes + defaults) and the SDK component source (authoritative overridable class map, incl. structural-only and dynamic classes)
- Marketplace manifest `description`, so the marketplace listing explains what it offers
- **API:** new **Withholding** section covering `GET /withholding/austria` — Austrian KESt balances, the `transaction_id` polling pattern, the nullable `transaction` completion signal, and the note that the 27.5% rate is already applied
- **API:** the **W-8IMY submission endpoint** `POST /account-owners/{id}/tax-documentation-data/w-8imy`, including `ein_type`, its distinct 26-value `fatca_classification`, and the `box_14`–`box_42` checkbox range
- **API:** the seven `gain_type` values, five of which are Austrian inventory pools
- **React SDK:** a "What Changed in 5.0.0" section covering the four breaking changes, plus the new `fatca` and `typesOfIncome` props and the `RESIDENCIES` questionnaire type
- **CLAUDE.md:** regeneration guidance that the SDK's own changelog misattributes CSS breaking changes, that `llms.txt` no longer lists changelogs, and that the utilities `.d.ts` surface is wider than the runtime exports

### Changed
- **React SDK:** documented version bumped `4.0.0` → `5.0.0`
- **API:** transaction read and write `type` vocabularies documented as separate lists, since responses return UPPERCASE values that cannot be resubmitted
- **API:** `account_type` corrected to its full 13 values, adding `US_EMPLOYER_PLAN`, `US_ANNUITY_INSURANCE`, and `US_TRUMP_ACCOUNT`
- **API:** disposition method lists split by endpoint — the history endpoints take four values, the account endpoints also take `AUSTRIA`, and `SPECID` is per-transaction only
- Renamed the plugin marketplace from `taxbit-plugins` to `taxbit-skills` for consistency with the repo name. The Claude Code install command is now `/plugin install taxbit@taxbit-skills`. Any existing users who added the marketplace under the old name must remove and re-add it: `/plugin marketplace remove taxbit-plugins` then `/plugin marketplace add git@github.com:taxbit-shared/taxbit-skills.git`.

### Removed
- **The `taxbit:utilities` skill has been removed.** `@taxbit/utilities` is an internal dependency of the React SDK rather than a supported public surface, so this package no longer documents its lookups, validators, or types. The React SDK skill now presents `ClientTaxDocumentation` and `ClientTaxResidency` as imports from `@taxbit/react-sdk`. Users who invoked `/taxbit:utilities` will no longer find it.

### Fixed
- **API:** removed the false statement that no W-8IMY submission endpoint exists. It does, at a non-standard documentation slug, which is how the error went unnoticed.
- **API:** corrected the transaction single-item paths from `/transactions/{id}` to `/transactions/external-id/{id}`
- **API:** form item aggregates accept `1099_DA` as well as `1099_B`, and the batch endpoint returns `errors[]` with an `index`, not `failures[]`
- **React SDK:** removed seven classes that appear in no shipped bundle and were documented in error — the four `taxbit-address-*` subfield classes plus `taxbit-progress-status`, `taxbit-input-status-footer`, and `taxbit-textarea`. Address subfields are generated at runtime from the field key instead. The full class reference now matches the bundle exactly.

## [0.3.0] - 2026-07-08

### Added
- **New `taxbit:utilities` skill** covering `@taxbit/utilities` v7.1.0 — lookups (dropdown option lists), format validators, error-message helpers, tax-documentation type guards/types, treaty helpers, and camel/snake case converters (the internal `ValidationReport` builders are intentionally omitted — see CLAUDE.md)
- **React SDK:** documented the `TaxbitTaxResidencies` widget and the SDK's re-exported types (`Region`, `Locale`, `Progress`, `ClientTaxDocumentation`, `ClientTaxResidency`, `ClientTaxDocumentationStatus`), which were missing from v4 coverage

## [0.2.0] - 2026-07-08

Regenerated both skills against the current Taxbit API and React SDK v4.

### Added
- **React SDK:** `TaxbitCuringDocumentation` component and W-8 issue curing flow (curable issue types, reasonable-explanation flow, demo/region/proxy modes)
- **React SDK:** new props `prepopulateWithSavedData`, `region`, `proxyDomain`, `proxyHeaders`; new `useTaxbit` return fields (`needsCuringDocumentation`, `isLoading`, `refresh`, `refreshStatus`, `refreshSubmission`); token-expiration remount pattern
- **API:** Reports section (async `POST /reports/inventory-summary` + status/download endpoint)
- **API:** Webhooks section (event types, `x-taxbit-signature` HMAC-SHA256 verification, retries)
- **API:** full Filers CRUD (`GET`/`PATCH`/`DELETE /filers/{id}`) with Chapter 3/4 status enums; account-owner-token-scoped tax-documentation endpoint variants; expanded account-owner, account, and transaction fields/enums

### Changed
- **React SDK:** documented version bumped from `3.5.0-beta.0` to `4.0.0`; W-8IMY added to W-FORM types; expanded TIN/VAT status and locale (50+) enums
- **API:** corrected form-level enums (W-9 `tax_classification`/`tin_type`, W-8BEN-E classification & limitation-on-benefits, self-certification classification), TIN validation statuses (added `VALID_SSN_EIN_MATCH`), and transaction `type`/`subtype` enums; added EU base URL

### Removed
- **API:** Payers endpoints (removed from the Taxbit API; superseded by Filers)

## [0.1.0] - 2026-03-11

### Added
- Comprehensive API skill with full endpoint documentation for all Taxbit API resources (auth, account owners, accounts, transactions, tax documentation, gains, inventory, form items, documents, TIN validation, payers)
- React SDK skill covering TaxbitQuestionnaire, useTaxbit hook, adaptive mode, and styling
- README with installation instructions and skill overview
- CLAUDE.md with regeneration instructions and design decisions
- Marketplace manifest (`.claude-plugin/marketplace.json`) for plugin distribution
- CHANGELOG.md
