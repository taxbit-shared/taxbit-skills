# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

An agent skills package that provides two skills for integrating with the Taxbit platform. Compatible with Claude Code (as a plugin) and 40+ other AI agents via the [Skills CLI](https://skills.sh):

- **`taxbit:api`** (`skills/api/SKILL.md`) — REST API integration guidance (authentication, endpoints, error handling)
- **`taxbit:react-sdk`** (`skills/react-sdk/SKILL.md`) — React SDK integration for tax form collection (`@taxbit/react-sdk`)

## Plugin Structure

```
CLAUDE.md                            # This file — instructions for regenerating content
plugin.json                          # Plugin manifest (name: "taxbit")
.claude-plugin/marketplace.json      # Marketplace manifest (name: "taxbit-plugins")
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
/plugin install taxbit@taxbit-plugins
```

## Content Generation

All content in `skills/api/SKILL.md`, `skills/react-sdk/SKILL.md`, and `README.md` is AI-generated from the Taxbit documentation. No single developer is responsible for authoring these files. When updating, always regenerate from the source docs rather than hand-editing.

### How to Regenerate the API Skill (`skills/api/SKILL.md`)

1. Fetch the full endpoint listing from `https://apidocs.taxbit.com/reference/`
2. Fetch each individual endpoint page to get request/response schemas, field types, enums, and examples. Key pages include:
   - Auth: `reference/auth-token`, `reference/post_oauth-account-owner-token`
   - Account Owners: `reference/account-owners`, `reference/get_account-owners-id-us-tin-validation-status`
   - Tax Documentation: `reference/post_account-owners-id-tax-documentation-data-w-9`, `reference/post_account-owners-id-tax-documentation-data-w-8ben`, `reference/post_account-owners-id-tax-documentation-data-w-8ben-e`, `reference/post_account-owners-id-tax-documentation-data-self-certification`, `reference/get_account-owners-id-tax-documentation-data`, `reference/get_account-owners-id-tax-documentation-status`, `reference/post_account-owners-id-tax-documentation-data-document`, `reference/get_account-owners-id-tax-documentation-data-document-document-id`
   - Accounts: `reference/post_accounts`, `reference/patch_accounts-id`, `reference/get_accounts-id`
   - Transactions: `reference/post_transactions-external-id`, `reference/get_accounts-id-transactions`
   - Aggregations: `reference/get_accounts-id-income`
   - Form Items: `reference/post_form-items-batch`, `reference/get_users-user-id-form-items`, `reference/get_form-items-aggregates-document-type`
   - Documents: `reference/get_accounts-id-tax-documents`
   - Gains: `reference/get_gains`, `reference/get_gains-breakdown`, `reference/get_gains-summary`
   - Inventory: `reference/get_inventory`, `reference/get_inventory-summaries`
   - Transfer Lots: `reference/post_transfer-lots-transactions-transaction-id`
   - Disposition Methods: `reference/post_accounts-id-disposition-methods-history`
   - TIN Validation: `reference/post_validations-us-tin`
   - Payers: `reference/get_tenants-tenant-id-payers`
   - Treaty Rates: `reference/get_tax-treaty-rates`
3. Write the skill file with this structure:
   - YAML frontmatter: `name: api`, `description` (trigger conditions), `allowed-tools` (Read, Grep, Glob, Bash, Write, Edit, WebFetch)
   - Role statement: "You are a Taxbit API integration assistant..."
   - API Overview with bullet list of resource categories
   - Base URLs (production and staging)
   - Authentication section covering both token types (tenant-scoped and account-owner-scoped) with request/response examples
   - One section per resource with endpoint table (Method | Path | Description) and key request/response fields with types and enums
   - Rate Limits, Error Handling (status codes + response format), Integration Patterns
   - Links to full reference and guides

### How to Regenerate the React SDK Skill (`skills/react-sdk/SKILL.md`)

1. Fetch the SDK docs from:
   - `https://apidocs.taxbit.com/docs/react-sdk-v1`
   - `https://apidocs.taxbit.com/docs/adaptive-mode-integration-guide`
   - `https://apidocs.taxbit.com/docs/tax-documentation-guide`
   - Also check the npm page for `@taxbit/react-sdk` for the latest version
2. Write the skill file with this structure:
   - YAML frontmatter: `name: react-sdk`, `description` (trigger conditions), `allowed-tools` (Read, Grep, Glob, Bash, Write, Edit, WebFetch)
   - Role statement: "You are a Taxbit React SDK integration assistant..."
   - Package info (npm name, latest version, install command, React/TypeScript compatibility)
   - Quick Start example with `TaxbitQuestionnaire` component and CSS import
   - Questionnaire types table (`W-FORM`, `DPS`, `SELF-CERT`)
   - Authentication section explaining account-owner-scoped tokens (server-side only) with code example
   - Full `TaxbitQuestionnaire` props table with types and descriptions
   - Adaptive Mode section with modes (`full`, `skipLock`, `skipEdit`), data rules, and example
   - `useTaxbit` hook section with status fields, TIN validation statuses, VAT validation statuses
   - `onProgress` callback with `Progress` type definition and step IDs
   - CSS/styling options (inline, basic, minimal)
   - Supported languages lists (W-FORM vs DPS/SELF-CERT)
   - Content Security Policy note
   - Demo Mode explanation
   - Common integration patterns
   - Links to full docs

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

- **Two skills, not one**: API and React SDK are separate skills because they serve different contexts (server-side vs client-side). This keeps each skill focused and avoids loading irrelevant content. The `description` field ensures Claude picks the right one.
- **Comprehensive inline docs**: Skills contain full endpoint/prop details rather than just linking to external docs. This is because Claude needs the information in its context window to generate accurate code. External links are provided as supplementary references.
- **Enum values included**: All enum values (disposition methods, TIN types, classifications, etc.) are listed inline so Claude can generate valid API payloads without guessing.
- **Both token types documented**: The API skill documents both tenant-scoped and account-owner-scoped tokens because developers frequently confuse which to use. The React SDK skill also covers the account-owner token since it's required for the SDK.
- **`allowed-tools` includes WebFetch**: Both skills include WebFetch so Claude can check the live docs if a developer asks about something not covered in the skill content.
- **Marketplace structure**: The `.claude-plugin/marketplace.json` with an `owner` field is required for the plugin to be installable via `/plugin marketplace add`. The `source: "./"` points to the plugin.json at the repo root.
- **Cross-agent compatibility**: The `SKILL.md` format is compatible with both Claude Code plugins and the Vercel Skills ecosystem (`npx skills add`). The `allowed-tools` frontmatter is Claude-specific and ignored by other agents. No changes are needed to support both install methods.
- **Two install methods, complementary**: `npx skills add` installs to `.claude/skills/` (and 41 other agent directories) for project-level auto-invocation. The Claude Code plugin install adds `/taxbit:api` and `/taxbit:react-sdk` slash commands. Both can coexist without conflict.
