# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Fixed
- **React SDK:** `onProgress`'s `percentComplete` is documented as an integer from 0 to 100 (`Math.round(stepIndex / (steps.length - 1) * 100)`), not left ambiguous between 0–1 and 0–100.

## [0.6.0] - 2026-09-30

### Added
- **React SDK:** `reference/upgrading-to-6.md`, covering the `@taxbit/react-sdk` 6.0.0 breaking changes (stylesheets, DOM and test selectors, per-language ES build files, host-page accessibility duties) and the non-breaking additions (screen-reader support, focus on step change, server rendering, on-demand languages).

### Changed
- **React SDK:** documented version bumped `5.0.0` → `6.0.0`. The styling reference now covers the 17 `--taxbit-color-*` custom properties and their AA-contrast defaults (theme with them on 6.0.0+; class overrides still work), the primary-before-Back DOM order and `row-reverse`, `<h4>` section titles, group labels as `<div class="taxbit-label">`, the new `taxbit-required-marker` and `taxbit-section-header-title-group` classes, and `aria-disabled` on the primary action. Verified against the 6.0.0 bundles and SDK source, not only the SDK changelog.
- **React SDK:** `SKILL.md` is now core usage plus pointers (328 lines / 20 KB, down from 692 / 45 KB), within Anthropic's under-500-lines guidance and the 5,000 tokens a skill keeps after compaction. Styling and the class reference, curing, adaptive mode, `onProgress`, `TaxbitTaxResidencies`, supported languages, the 5.0.0 upgrade notes, and the full security checklist moved verbatim to `skills/react-sdk/reference/`. Each pointer keeps the key facts (for example, how to theme, and the breaking changes).

### Fixed
- **React SDK:** removed "there are no CSS custom properties", which is false for 6.0.0.
- **React SDK:** `taxbit-error-message-<field>` is an element `id` used for `aria-describedby`, not a class (true in 5.0.0 too). Per-field error styling is `.taxbit-question-<field> .taxbit-error-message`.
- **React SDK:** the `taxbit-address-*` subfield classes are documented as nonexistent (no longer "declared but unused").

## [0.5.0] - 2026-09-30

### Added
- **API:** a complete endpoint reference in `skills/api/reference/`, generated from Taxbit's OpenAPI spec: all 65 operations, one file per endpoint, with every parameter and body field (type, required, allowed values), examples, and responses. Agents open only the files a task needs.
- **API:** the six **Assets** endpoints (configure, list, look up, get, update, delete), which the skill had never covered.
- **API:** format notes for the treaty claim fields (`treaty_claim_article_paragraph`, `treaty_claim_rate_of_withholding`, `treaty_claim_has_additional_conditions`), merged into those fields wherever they appear. The docs' sample article reference ("Article 12, Paragraph 1") is rejected by the API.
- `scripts/generate-api-reference.mjs` with `--check` and tests (`node --test scripts/`).

### Changed
- **API:** `SKILL.md` is now guidance plus an index of the reference (15 KB, down from 48 KB), so each use loads far less context. Per-area behavior notes moved to `src/api-notes/` and appear at the top of each area's reference file.
- **CLAUDE.md:** the API regeneration recipe now runs the generator for the endpoint reference and reads only the guides for the guidance, instead of fetching 60+ endpoint pages.

### Fixed
- **API:** the skill's frontmatter began with four spaces, so agents didn't recognize `SKILL.md` as a skill and `taxbit:api` wasn't offered.
- **API:** self-certification `signature_capacity` values are `OFFICER`, `EXECUTOR`, `OTHER_CAPACITY` (the skill listed six values the API doesn't accept).

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
- **API:** form item aggregates accept `1099_DA` as well as `1099_B`
- **API:** documented the shape of the batch upsert's `failures[]` items, which carry `form_item` and a string `error` and no positional index
- **React SDK:** the class reference now matches the shipped bundle exactly. Removed `taxbit-progress-status`, `taxbit-input-status-footer`, and `taxbit-textarea`, which appear nowhere in the package. The four `taxbit-address-*` subfield classes are now marked as declared in SDK source but unused, so absent from every bundle through 5.0.0; address subfields are generated at runtime from the field key instead.

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
