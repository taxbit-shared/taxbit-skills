# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Cross-agent support via Vercel Skills CLI (`npx skills add taxbit-shared/taxbit-skills`) — works with 42 agents including Cursor, GitHub Copilot, Windsurf, and more
- Install method comparison table in README
- **React SDK:** expanded "CSS / Styling & Customization" section — full `taxbit-*` class reference (authoritative SDK class map grouped by DOM nesting: root/page chrome, sections, field rows, form controls, address composite, buttons, status/messages/badges, state modifiers), the dynamic class families (`taxbit-form-*`/`taxbit-question-*`/`taxbit-error-message-*`) documented as a kebab-case naming rule with the aria-`id` caveat, the "no CSS variables, override the classes" contract, the four bundled stylesheets (incl. the previously-undocumented `index.css`), default design tokens, a specificity note, and override examples. Emphasizes that the shipped CSS is minimal/unopinionated and meant to be replaced.
- **CLAUDE.md:** regeneration recipe for the styling section, sourced from both the package's bundled `style/*.css` (styled classes + defaults) and the SDK component source (authoritative overridable class map, incl. structural-only and dynamic classes)

### Changed
- **React SDK:** documented version bumped `4.0.0` → `4.1.0`
- Renamed the plugin marketplace from `taxbit-plugins` to `taxbit-skills` for consistency with the repo name. The Claude Code install command is now `/plugin install taxbit@taxbit-skills`. Any existing users who added the marketplace under the old name must remove and re-add it: `/plugin marketplace remove taxbit-plugins` then `/plugin marketplace add git@github.com:taxbit-shared/taxbit-skills.git`.

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
