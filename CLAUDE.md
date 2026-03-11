# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A Claude Code plugin that provides two skills for integrating with the Taxbit platform:

- **`taxbit:api`** (`skills/api/SKILL.md`) — REST API integration guidance (authentication, endpoints, error handling)
- **`taxbit:react-sdk`** (`skills/react-sdk/SKILL.md`) — React SDK integration for tax form collection (`@taxbit/react-sdk`)

## Plugin Structure

```
plugin.json              # Plugin manifest (name: "taxbit")
skills/
  api/SKILL.md           # Taxbit REST API skill
  react-sdk/SKILL.md     # Taxbit React SDK skill
```

## How Skills Work

Each `SKILL.md` has YAML frontmatter (`name`, `description`, `allowed-tools`) followed by markdown instructions that Claude receives when the skill is invoked. Claude auto-invokes skills when their `description` matches the user's task, or users invoke them manually via `/taxbit:api` or `/taxbit:react-sdk`.

## Installation

Users add this plugin with:
```
/plugin marketplace add git@github.com:taxbit-shared/taxbit-skills.git
/plugin install taxbit@taxbit-plugins
```

## Editing Guidelines

- Keep skill content accurate against https://apidocs.taxbit.com — if the API changes, update the skills accordingly
- The `description` field in frontmatter controls when Claude auto-invokes the skill — keep it precise about trigger conditions
- API skill covers server-side concerns; React SDK skill covers front-end concerns — maintain this separation
