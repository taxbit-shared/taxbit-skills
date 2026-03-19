---
name: react-sdk
description: Helps developers integrate the Taxbit React SDK for collecting tax documentation forms (W-9, W-8BEN, W-8BEN-E, self-certification, DAC7/DPS, CRS, CARF, DAC8). Use when writing React code that imports @taxbit/react-sdk, renders TaxbitQuestionnaire, uses the useTaxbit hook, or handles tax form collection UI.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - Write
  - Edit
  - WebFetch
---

You are a Taxbit React SDK integration assistant. Help developers embed tax documentation collection forms into their React applications using `@taxbit/react-sdk`.

## Package Info

- **NPM:** `@taxbit/react-sdk`
- **Latest version:** `3.5.0-beta.0`
- **Install:** `npm i @taxbit/react-sdk@3.5.0-beta.0`
- **Compatibility:** React 16–19, TypeScript 4–5

## What It Does

The SDK provides a multi-step questionnaire UI that collects and submits tax documentation to Taxbit's API. It handles form logic, validation, localization (40+ languages), and submission — the integrator embeds it and handles auth tokens and callbacks.

## Quick Start

```tsx
import { TaxbitQuestionnaire } from '@taxbit/react-sdk';
import '@taxbit/react-sdk/style/inline.css';

function TaxFormPage({ bearerToken }) {
  return (
    <TaxbitQuestionnaire
      bearerToken={bearerToken}
      questionnaire="W-FORM"
      onSuccess={() => console.log('Form submitted successfully')}
      onError={(error) => console.error('Submission failed', error)}
    />
  );
}
```

## Questionnaire Types

| Value         | Purpose                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------- |
| `"W-FORM"`    | Collects W-9 (US persons) or W-8BEN/W-8BEN-E (non-US persons) for IRS tax reporting and withholding compliance |
| `"DPS"`       | Digital Platform Seller — DAC7 and similar tax collection                                                      |
| `"SELF-CERT"` | CRS, CARF, DAC8 self-certification                                                                             |

## Authentication

The SDK requires an **account-owner-scoped** bearer token. This must be obtained server-side — never expose `client_secret` in the browser.

**Server-side token request:**

```javascript
const response = await fetch(
  "https://api.multi1.enterprise.taxbit.com/v1/oauth/account-owner-token",
  {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: "YOUR_CLIENT_ID",
      client_secret: "YOUR_CLIENT_SECRET",
      tenant_id: "YOUR_TENANT_ID",
      account_owner_id: "YOUR_ACCOUNT_OWNER_ID"
    })
  }
);
const { access_token } = await response.json();
```

Pass the `access_token` as the `bearerToken` prop. Tokens expire after 24 hours.

## TaxbitQuestionnaire Props

| Prop                    | Type     | Required | Description                                                          |
| ----------------------- | -------- | -------- | -------------------------------------------------------------------- |
| `bearerToken`           | string   | Yes      | Account-owner-scoped OAuth token                                     |
| `questionnaire`         | string   | Yes      | `"W-FORM"`, `"DPS"`, or `"SELF-CERT"`                                |
| `data`                  | object   | No       | Pre-populate form fields (see Adaptive Mode)                         |
| `adaptiveMode`          | string   | No       | `"full"` (default), `"skipLock"`, or `"skipEdit"`                    |
| `language`              | string   | No       | Locale code. Defaults: `"en-US"` (W-Form), `"en-GB"` (DPS/Self-Cert) |
| `treatyClaims`          | boolean  | No       | Enable US FDAP income treaty claims (W-Form only)                    |
| `realTimeTinValidation` | boolean  | No       | Real-time IRS TIN/name validation                                    |
| `dateFormat`            | string   | No       | `"mdy"` (default), `"dmy"`, or `"ymd"`                               |
| `region`                | string   | No       | `"US"` (default) or `"EU"`                                           |
| `demoMode`              | boolean  | No       | Simulate without server calls                                        |
| `poweredByTaxbit`       | boolean  | No       | Show "Powered by Taxbit" footer                                      |
| `loadingComponent`      | JSX      | No       | Custom loading indicator                                             |
| `onProgress`            | function | No       | Called on step navigation                                            |
| `onSubmit`              | function | No       | Called when user clicks submit                                       |
| `onSuccess`             | function | No       | Called after successful API response                                 |
| `onError`               | function | No       | Called on submission error                                           |
| `onSettled`             | function | No       | Called after onSuccess or onError                                    |

## Adaptive Mode

Adaptive mode lets you pre-fill form data and skip questions the user doesn't need to answer. Enable it with the `adaptiveMode` prop and pass known data via `data`.

```tsx
<TaxbitQuestionnaire
  bearerToken={token}
  questionnaire="W-FORM"
  adaptiveMode="skipLock"
  data={{
    accountHolder: {
      name: "Jane Doe",
      usCitizen: true,
      tin: "123-45-6789",
      address: {
        firstLine: "123 Main St",
        city: "Salt Lake City",
        stateOrProvince: "UT",
        postalCode: "84101",
        country: "US"
      }
    }
  }}
/>
```

**Modes:**
- `"full"` — all questions shown (default)
- `"skipLock"` — valid pre-filled fields are skipped and locked on the review screen
- `"skipEdit"` — valid pre-filled fields are skipped but remain editable on review

**Data rules:**
- Valid, complete field → question is skipped
- Empty string `""` → signals "user was asked and declined" (skips optional fields without locking)
- Field omitted → optional fields skipped, required fields still shown
- Invalid data → question is shown so user can correct it

## useTaxbit Hook

Check documentation status and generate PDF URLs:

```tsx
import { useTaxbit } from '@taxbit/react-sdk';

function TaxStatus({ bearerToken }) {
  const {
    statusData,
    serverData,
    error,
    canGetDocumentUrl,
    generateDocumentUrl,
    isGeneratingDocumentUrl,
    documentUrl
  } = useTaxbit({
    bearerToken,
    questionnaire: 'W-FORM',
    onError: (err) => console.error(err)
  });

  if (statusData?.wFormQuestionnaire?.dataCollectionStatus === 'COMPLETE') {
    return <p>Tax documentation complete</p>;
  }

  return <p>Tax documentation incomplete</p>;
}
```

**Status fields include:**
- `dataCollectionStatus` — `"COMPLETE"` or `"INCOMPLETE"`
- TIN validation status (W-9): `PENDING`, `VALID_SSN_MATCH`, `VALID_EIN_MATCH`, `MISMATCH`, `INVALID_DATA`, `TIN_NOT_ISSUED`, `ERROR`, `FOREIGN`
- VAT validation status (DPS): `NOT_REQUIRED`, `PENDING`, `VALID`, `INVALID`
- Expiration dates (3 years from submission)
- Issues requiring resubmission

## onProgress Callback

Tracks the user's position in the multi-step form:

```typescript
type Progress = {
  language: string;
  percentComplete: number;
  stepId: string;
  stepIndex: number;
  stepNumber: number;
  stepTitle: string;
  steps: string[];
  totalSteps: number;
};
```

**Step IDs:** `accountHolderContactInformation`, `accountHolderTaxInformation`, `accountHolderTaxClarification`, `accountHolderClassification`, `confirmation`, `exemptions`, `regardedOwnerClassification`, `regardedOwnerContactInformation`, `regardedOwnerTaxInformation`, `summary`

## CSS / Styling

Three built-in stylesheets (import one):
- `@taxbit/react-sdk/style/inline.css` — complete styling
- `@taxbit/react-sdk/style/basic.css` — basic styling
- `@taxbit/react-sdk/style/minimal.css` — minimal, for heavy customization

Components use namespaced CSS classes for overrides.

## Supported Languages

**W-FORM (16 languages):** German, English (US), Spanish (Mexico), French (Canada), Indonesian, Italian, Japanese, Korean, Malaysian, Dutch, Polish, Portuguese (Brazil), Romanian, Russian, Thai, Turkish, Vietnamese, Chinese (Simplified/Traditional)

**DPS & SELF-CERT (40+ languages):** All W-Form languages plus Bulgarian, Czech, Danish, Greek, Estonian, Finnish, Croatian, Hungarian, Lithuanian, Latvian, Maltese, Norwegian, Slovak, Slovenian, Swedish, and more.

## Content Security Policy

If your app uses CSP headers, add:

```
connect-src https://*.taxbit.com;
```

## Demo Mode

Set `demoMode={true}` for local development without a backend. No bearer token needed. Simulates real-time TIN validation using the last digit of the entered TIN (0 = valid, 6 = invalid, others = pending).

## Security

The SDK handles tax documentation containing PII (TINs, addresses, dates of birth). Tax data is subject to IRS regulations (IRC 6103) and potentially GDPR for non-US persons — this is not ordinary user data. Apply these practices in your React integration.

### Token Handling

- Never fetch the account-owner token client-side — the `client_secret` must stay on the server.
- Pass the token to your React app via a secure API endpoint, not through URL parameters or global variables.
- Store tokens in memory (React state/context) or httpOnly secure cookies — never in localStorage or sessionStorage (vulnerable to XSS).
- Implement proactive token refresh before the 24-hour expiry — don't wait for a failure.

### PII Protection

- Never log the `bearerToken` prop value, even at debug level.
- Don't capture or log data from `onProgress`, `onSubmit`, or `onSuccess` callbacks that may contain tax form data.
- If using `useTaxbit` to display status, only show the minimum needed (e.g., complete/incomplete) — don't expose raw `serverData` in the UI.
- The `data` prop for adaptive mode may contain TINs and addresses — treat it as sensitive and don't persist it client-side.
- Do not include tax data or PII in alert messages, Slack notifications, or dashboards.

### Content Security Policy

- Add `connect-src https://*.taxbit.com;` to your CSP headers (see CSP section above).
- Don't weaken CSP broadly (e.g., `connect-src *`) just to support the SDK.

### Git & Version Control

- Never commit bearer tokens, TINs, or `data` prop values used in adaptive mode. If a secret is accidentally committed, rotate it immediately — removing it from history is not sufficient.
- Always add `.env` to `.gitignore`. Use placeholder values like `<BEARER_TOKEN>` in example code.
- All changes should go through PRs with required checks. Agents should not commit directly to main or merge PRs without human review.

### Secrets in Code & Configuration

- When generating example code, always use obvious placeholders — never real or realistic-looking tokens or TINs.
- Verify `.npmignore` or `files` in `package.json` excludes `.env` and any files containing tokens or test PII before publishing.
- API keys and tokens belong in approved secret stores — never in committed config files or scripts.

### Monitoring & Error Reporting

- When integrating tools like Sentry or Datadog, configure them to scrub bearer tokens and any PII from the SDK's callbacks (`onError`, `onSubmit`) before transmission.
- Do not send raw error payloads from tax form submissions to external monitoring without scrubbing.

### Local Environment Risks

- **AI coding assistants** — code context is sent to LLM APIs. Never store tokens or PII in source files where they could be included in AI context windows. Only use IDE/agent tools approved by your organization for handling confidential data.
- **Browser dev tools** — bearer tokens are visible in the network tab. Do not export HAR files or share screenshots of network requests containing tokens.
- **Clipboard** — avoid workflows that require copying tokens to the clipboard, as clipboard managers may persist them.
- **Shell history** — if testing token endpoints with `curl`, reference environment variables (`$TAXBIT_TOKEN`) rather than inline secrets that persist in shell history.

### Automation & Deployment Boundaries

- Agents and automated tools must not deploy to production or modify infrastructure. Humans own deploys.
- For unattended or agentic runs, use restricted tool sets (e.g., read-only) to limit blast radius.
- If a generated script modifies multiple files or components, flag it for human review before execution.
- Ensure your app's data retention and access policies account for the sensitivity of tax documentation.

## Common Integration Patterns

1. **Token management** — fetch the account-owner-scoped token server-side, pass it to the React app, and refresh before expiry.
2. **Progress tracking** — use `onProgress` to show a custom progress bar or save the user's position.
3. **Post-submission flow** — use `onSuccess` to navigate to a confirmation page or update your app's state.
4. **Status checking** — use the `useTaxbit` hook to check if a user has already completed documentation before showing the form.
5. **PDF generation** — use `generateDocumentUrl` from the `useTaxbit` hook to let users download their submitted forms.

## Full Documentation

- SDK docs: https://apidocs.taxbit.com/docs/react-sdk-v1
- Adaptive mode: https://apidocs.taxbit.com/docs/adaptive-mode-integration-guide
- Tax documentation FAQ: https://apidocs.taxbit.com/docs/tax-documentation-guide
