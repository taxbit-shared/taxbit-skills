# Taxbit Skills Plugin

A [Claude Code](https://claude.ai/code) plugin that provides skills for integrating with the [Taxbit](https://taxbit.com) platform.

## Skills

| Skill | Command | Description |
|-------|---------|-------------|
| **API** | `/taxbit:api` | REST API integration — authentication, endpoints, error handling |
| **React SDK** | `/taxbit:react-sdk` | React SDK integration for tax form collection (`@taxbit/react-sdk`) |

Skills are auto-invoked when Claude detects a relevant task, or you can invoke them manually with the commands above.

## Installation

Add the marketplace, then install the plugin:

```
/plugin marketplace add git@github.com:taxbit-shared/taxbit-skills.git
/plugin install taxbit@taxbit-plugins
```

## Project Structure

```
plugin.json              # Plugin manifest
skills/
  api/SKILL.md           # Taxbit REST API skill
  react-sdk/SKILL.md     # Taxbit React SDK skill
```

## Resources

- [Taxbit API Documentation](https://apidocs.taxbit.com)
- [Claude Code Plugins](https://docs.anthropic.com/en/docs/claude-code)
