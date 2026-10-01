<!-- Moved from skills/react-sdk/SKILL.md; regenerate with it (see CLAUDE.md). -->

# Security

The SDK handles tax documentation containing PII (TINs, addresses, dates of birth). Tax data is subject to IRS regulations (IRC 6103) and potentially GDPR for non-US persons — this is not ordinary user data. Apply these practices in your React integration.

## Token Handling

- Never fetch the account-owner token client-side — the `client_secret` must stay on the server.
- Pass the token to your React app via a secure API endpoint, not through URL parameters or global variables.
- Store tokens in memory (React state/context) or httpOnly secure cookies — never in localStorage or sessionStorage (vulnerable to XSS).
- Account-owner tokens last 1 hour: mint a fresh one before `expires_in` runs out rather than waiting for a failure. When refreshing after a 401, change the component `key` to force a clean remount (see Handling Token Expiration).

## PII Protection

- Never log the `bearerToken` prop value, even at debug level.
- Don't capture or log data from `onProgress`, `onSubmit`, `onSuccess`, or curing `onSuccess`/`onSettled` callbacks that may contain tax form data.
- If using `useTaxbit` to display status, only show the minimum needed (e.g. complete/incomplete) — don't expose raw `serverData` in the UI.
- The `data` prop for adaptive mode may contain TINs and addresses — treat it as sensitive and don't persist it client-side.
- Do not include tax data or PII in alert messages, Slack notifications, or dashboards.

## Content Security Policy

- Add `connect-src https://*.taxbit.com;` to your CSP headers (see CSP section above).
- Don't weaken CSP broadly (e.g. `connect-src *`) just to support the SDK.

## Git & Version Control

- Never commit bearer tokens, TINs, or `data` prop values used in adaptive mode. If a secret is accidentally committed, rotate it immediately — removing it from history is not sufficient.
- Always add `.env` to `.gitignore`. Use placeholder values like `<BEARER_TOKEN>` in example code.
- All changes should go through PRs with required checks. Agents should not commit directly to main or merge PRs without human review.

## Secrets in Code & Configuration

- When generating example code, always use obvious placeholders — never real or realistic-looking tokens or TINs.
- Verify `.npmignore` or `files` in `package.json` excludes `.env` and any files containing tokens or test PII before publishing.
- API keys and tokens belong in approved secret stores — never in committed config files or scripts.
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

## Monitoring & Error Reporting

- When integrating tools like Sentry or Datadog, configure them to scrub bearer tokens and any PII from the SDK's callbacks (`onError`, `onSubmit`) before transmission.
- Do not send raw error payloads from tax form submissions to external monitoring without scrubbing.

## Local Environment Risks

- **AI coding assistants** — code context is sent to LLM APIs. Never store tokens or PII in source files where they could be included in AI context windows. Only use IDE/agent tools approved by your organization for handling confidential data.
- **Browser dev tools** — bearer tokens are visible in the network tab. Do not export HAR files or share screenshots of network requests containing tokens.
- **Clipboard** — avoid workflows that require copying tokens to the clipboard, as clipboard managers may persist them.
- **Shell history** — if testing token endpoints with `curl`, reference environment variables (`$TAXBIT_TOKEN`) rather than inline secrets that persist in shell history.

## Automation & Deployment Boundaries

- Agents and automated tools must not deploy to production or modify infrastructure. Humans own deploys.
- For unattended or agentic runs, use restricted tool sets (e.g. read-only) to limit blast radius.
- If a generated script modifies multiple files or components, flag it for human review before execution.
- Ensure your app's data retention and access policies account for the sensitivity of tax documentation.
