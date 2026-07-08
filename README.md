# Taxbit Skills Plugin

An agent skills package for integrating with the [Taxbit](https://taxbit.com) platform. Works with [Claude Code](https://claude.ai/code), [Cursor](https://cursor.com), [GitHub Copilot](https://github.com/features/copilot), [Windsurf](https://windsurf.com), and [40+ other AI agents](https://skills.sh).

## Skills

| Skill | Description |
|-------|-------------|
| **API** | REST API integration — authentication, account owners, transactions, tax documentation, gains/inventory, reports, filers, TIN validation, webhooks, and error handling |
| **React SDK** | React SDK integration for tax form collection and W-8 issue curing (`@taxbit/react-sdk` v4) |
| **Utilities** | Lookups, validators, error-message helpers, type guards, and types for building custom tax-doc UIs (`@taxbit/utilities` v7) |

Skills are auto-invoked when the agent detects a relevant task.

## Installation

### Any Agent (via Skills CLI)

```
npx skills add taxbit-shared/taxbit-skills
```

This installs to all supported agents in your project. See [skills.sh](https://skills.sh) for more info.

### Claude Code Only

```
/plugin marketplace add git@github.com:taxbit-shared/taxbit-skills.git
/plugin install taxbit@taxbit-skills
```

With Claude Code, you can also invoke skills manually via `/taxbit:api`, `/taxbit:react-sdk`, or `/taxbit:utilities`.

### Comparison

| | Auto-invoke | Slash commands | Multi-agent |
|---|---|---|---|
| **Skills CLI** (`npx skills add`) | Yes | No | Yes (42 agents) |
| **Claude Code plugin** (`/plugin install`) | Yes | `/taxbit:api`, `/taxbit:react-sdk`, `/taxbit:utilities` | No |

You can use both — they don't conflict. Use the Skills CLI to add project-level support for all agents, and the plugin for Claude Code slash commands.

## Project Structure

```
plugin.json              # Claude Code plugin manifest
skills/
  api/SKILL.md           # Taxbit REST API skill
  react-sdk/SKILL.md     # Taxbit React SDK skill
  utilities/SKILL.md     # Taxbit Utilities (@taxbit/utilities) skill
```

## Resources

- [Taxbit API Documentation](https://apidocs.taxbit.com)
- [Skills Directory](https://skills.sh)
- [Claude Code Plugins](https://docs.anthropic.com/en/docs/claude-code)
