---
name: react-sdk
description: Helps developers integrate the Taxbit React SDK for collecting tax documentation forms (W-9, W-8BEN, W-8BEN-E, W-8IMY, self-certification, DAC7/DPS, CRS, CARF, DAC8) and curing W-8 validation issues. Use when writing React code that imports @taxbit/react-sdk, renders TaxbitQuestionnaire, TaxbitCuringDocumentation, or TaxbitTaxResidencies, uses the useTaxbit hook, or handles tax form collection UI.
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
- **Latest version:** `6.0.0`
- **Install:** `npm i @taxbit/react-sdk`
- **Compatibility:** React 16–19 (peer dependency), TypeScript 5+ (type definitions bundled — no separate `@types` package needed)

**6.0.0 breaking changes** (props, exports, and `useTaxbit` unchanged): colors are `--taxbit-color-*` custom properties with new defaults; the primary button precedes Back in the DOM; tests must select controls by visible label or `id`, not a field-key `aria-label`; the ES build loads each language from its own file. Details: [reference/upgrading-to-6.md](reference/upgrading-to-6.md) (from 4.x, also [upgrading-to-5.md](reference/upgrading-to-5.md)). Under server rendering the questionnaire renders only its `loadingComponent`; to skip it, import client-side with `dynamic(..., { ssr: false })`.

## What It Does

The SDK provides a multi-step questionnaire UI that collects and submits tax documentation to Taxbit's API. It handles form logic, validation, localization (50+ locales), and submission. As of v4 it also ships `TaxbitCuringDocumentation`, a focused flow for resolving specific W-8 validation issues without re-submitting the whole form. The integrator embeds the components and handles auth tokens and callbacks.

## Exports

```tsx
import {
  TaxbitQuestionnaire,        // full multi-step tax form
  TaxbitCuringDocumentation,  // targeted W-8 issue remediation (v4+)
  TaxbitTaxResidencies,       // standalone tax-residency collection widget (v4+)
  useTaxbit,                  // read status/data, generate PDF URLs
  useTaxbitStatus,            // status-only hook (public since v5)
  ALL_QUESTIONNAIRES,         // readonly list of every QuestionnaireProp value
} from '@taxbit/react-sdk';
import '@taxbit/react-sdk/style/inline.css';
```

**Re-exported types:** `Region` (`'US' | 'EU'`), `Locale`, `Progress`, `ClientTaxDocumentationStatus`, `ClientTaxDocumentation`, and `ClientTaxResidency`. Import these from `@taxbit/react-sdk` for typing the `data` prop and callback payloads.

## Quick Start (Demo Mode)

No token or backend needed — great for local development:

```tsx
import { TaxbitQuestionnaire } from '@taxbit/react-sdk';
import '@taxbit/react-sdk/style/inline.css';

export default function App() {
  return <TaxbitQuestionnaire questionnaire="W-FORM" demoMode={true} />;
}
```

Set `questionnaire` to `"DPS"` or `"SELF-CERT"` to test other forms. In demo mode only `onSubmit` and `onProgress` are allowed: the types make `onSuccess`, `onError`, `onSettled`, `loadingComponent`, `bearerToken`, `region`, `staging`, and the proxy props `never`, so show your own confirmation from `onSubmit`.

## Production Quick Start

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

| Value | Purpose |
| --- | --- |
| `"W-FORM"` | Collects W-9 (US persons) or W-8BEN / W-8BEN-E / W-8IMY (non-US persons) for 1099 reporting and FDAP withholding compliance |
| `"DPS"` | Digital Platform Seller — DAC7 (EU), UK, NZ, and Canada MRDP obligations |
| `"SELF-CERT"` | CRS, CARF, DAC8 self-certification per OECD guidance |
| `"RESIDENCIES"` | Tax-residency collection only, backing the `TaxbitTaxResidencies` widget. Present in the `QuestionnaireProp` type but not yet described in the web docs |

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
      client_id: process.env.TAXBIT_CLIENT_ID,
      client_secret: process.env.TAXBIT_CLIENT_SECRET,
      tenant_id: process.env.TAXBIT_TENANT_ID,
      account_owner_id: accountOwnerId,
    }),
  }
);
const { access_token } = await response.json();
```

Pass `access_token` as the `bearerToken` prop. Tokens expire after 24 hours.

### Handling Token Expiration

The SDK has **no automatic token refresh and no `onTokenExpired` callback**. When a token expires, the SDK's API calls fail with `401 Unauthorized` and surface through your `onError` handler (and the `error` field of `useTaxbit`).

Recommended pattern — mint a fresh token server-side, then **change the `key` prop** to force a full remount (updating `bearerToken` alone can leave stale internal state, including the cached 401):

```tsx
function TaxForm() {
  const [bearerToken, setBearerToken] = useState(initialToken);
  const [tokenIssuedAt, setTokenIssuedAt] = useState(Date.now());

  const handleError = async (err) => {
    if (isExpiredError(err)) {
      const token = await mintToken(); // your server endpoint
      setBearerToken(token);
      setTokenIssuedAt(Date.now());
      return;
    }
    reportToMonitoring(err);
  };

  return (
    <TaxbitQuestionnaire
      key={tokenIssuedAt}
      bearerToken={bearerToken}
      questionnaire="W-FORM"
      onError={handleError}
    />
  );
}
```

## TaxbitQuestionnaire Props

| Prop | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `bearerToken` | string | Yes* | — | Account-owner-scoped token. *Not required when `demoMode` is true |
| `questionnaire` | `'W-FORM' \| 'DPS' \| 'SELF-CERT' \| 'RESIDENCIES'` | Yes | — | Form type to render |
| `data` | `ClientTaxDocumentation` | No | — | Pre-collected data; overrides server data if both exist (see Adaptive Mode) |
| `adaptiveMode` | `'full' \| 'skipLock' \| 'skipEdit'` | No | `'full'` | Behavior with pre-filled / prior data |
| `prepopulateWithSavedData` | boolean | No | `true` | Fetch the prior submission on mount; set `false` to skip server prefill |
| `language` | string (locale) | No | `'en-us'` (W-FORM), `'en-gb'` (DPS/SELF-CERT) | Pre-select form language |
| `treatyClaims` | boolean | No | `false` | W-FORM only: enable treaty claim questions in W-8 flows |
| `typesOfIncome` | `TypeOfIncome \| string \| (TypeOfIncome \| string)[]` | Yes if `treatyClaims` | — | W-FORM only: income types the account can generate. Drives treaty filtering. Throws if missing or unrecognized |
| `fatca` | boolean | No | `true` | New in 5.0.0. W-FORM only: enable FATCA (Chapter 4) collection. Throws if `false` while `typesOfIncome` includes `INTEREST` or `DIVIDENDS` |
| `realTimeTinValidation` | boolean | No | `false` | W-FORM only: validate name/TIN against IRS in real time (W-9) |
| `region` | `'US' \| 'EU'` | No | `'US'` | Route requests to the selected Taxbit region |
| `staging` | boolean | No | `false` | Call the staging API (`api.multi1.enterprise-staging.taxbit.com`). **Required when the token was minted on staging**; without it the SDK calls production and a staging token gets `401`. Not with `proxyDomain` or `demoMode` |
| `dateFormat` | `'mdy' \| 'dmy' \| 'ymd'` | No | `'mdy'` | Date picker order |
| `demoMode` | boolean | No | `false` | Render without server communication; no token needed |
| `proxyDomain` | string | No | — | Route API calls through your own proxy (mutually exclusive with `region`) |
| `proxyHeaders` | `Record<string, string>` | No | — | Extra headers for the proxy (`authorization` / `content-type` reserved) |
| `poweredByTaxbit` | boolean | No | `false` | Show "Powered by Taxbit" footer |
| `loadingComponent` | ReactNode | No | "Retrieving interview status…" | Custom loading UI (not allowed with `demoMode`) |
| `onProgress` | `(progress: Progress) => void` | No | — | Fires on navigation (Next, Back, Cancel, Submit) |
| `onSubmit` | `(data: ClientTaxDocumentation) => void`| No | — | Fires after client-side validation, before the API completes |
| `onSuccess` | `(data: ClientTaxDocumentation) => void`| No | — | Fires after a successful API submission (not allowed with `demoMode`) |
| `onError` | `(error: Error) => void` | No | Logs to console | Fires on submission error (not allowed with `demoMode`) |
| `onSettled` | `(data: ClientTaxDocumentation) => void`| No | — | Fires after `onSuccess` or `onError` (not allowed with `demoMode`) |

## Adaptive Mode

Adaptive mode pre-fills known data (`data`) and skips questions the user doesn't need to answer (`adaptiveMode`: `full`, `skipLock`, `skipEdit`). Modes, data rules, and an example: [reference/adaptive-mode.md](reference/adaptive-mode.md).

## useTaxbit Hook

Reads documentation status and data without rendering a form, and generates PDF download URLs.

```tsx
import { useTaxbit } from '@taxbit/react-sdk';

function TaxStatus({ bearerToken }) {
  const {
    statusData,
    serverData,
    error,
    isLoading,
    needsCuringDocumentation,
    canGetDocumentUrl,
    generateDocumentUrl,
    isGeneratingDocumentUrl,
    documentUrl,
    refresh,
  } = useTaxbit({
    bearerToken,
    questionnaire: 'W-FORM',
    onError: (err) => console.error(err),
  });

  if (isLoading) return <p>Loading…</p>;
  if (statusData?.wFormQuestionnaire?.dataCollectionStatus === 'COMPLETE') {
    return <p>Tax documentation complete</p>;
  }
  return <p>Tax documentation incomplete</p>;
}
```

**Parameters:** `bearerToken` (required), `questionnaire` (required), `onError`, `region`, `staging` (set when the token came from staging), `proxyDomain`, `proxyHeaders`, `prepopulateWithSavedData`.

**Return values:**

| Return | Type | Description |
| --- | --- | --- |
| `statusData` | `ClientTaxDocumentationStatus \| undefined`| Documentation status for this account owner |
| `serverData` | `ClientTaxDocumentation \| undefined` | Last submitted data |
| `error` | `Error \| undefined` | Fetch or token error |
| `isLoading` | boolean | True while the status fetch is in flight |
| `needsCuringDocumentation` | boolean | True when the user has ≥1 `OPEN` curable W-Form issue |
| `canGetDocumentUrl` | boolean | True once W-Form or Self-Cert is `COMPLETE` (always false for DPS) |
| `generateDocumentUrl` | `() => void` | Triggers PDF URL generation |
| `isGeneratingDocumentUrl` | boolean | True while URL generation is in flight |
| `documentUrl` | `string \| undefined` | Temporary PDF URL; refreshed roughly every 4 minutes |
| `refresh` | `() => Promise<void>` | Re-fetch status + submission |
| `refreshStatus` | `() => Promise<void>` | Re-fetch status only |
| `refreshSubmission` | `() => Promise<void>` | Re-fetch submission only |

### Status shape

```ts
type ClientTaxDocumentationStatus = {
  wFormQuestionnaire?: {
    dataCollectionStatus: 'COMPLETE' | 'INCOMPLETE';
    type: 'W-9' | 'W-8BEN' | 'W-8BEN-E' | 'W-8IMY';
    expirationDate?: string;
    issues?: QuestionnaireIssue[];
    needsResubmission?: boolean;
    tinStatus?: TinStatus;
    tinValidationDate?: string;
    treatyClaimStatus?: 'VALID' | 'INVALID';
  };
  dpsQuestionnaire?: {
    dataCollectionStatus: 'COMPLETE' | 'INCOMPLETE';
    expirationDate?: string;
    needsResubmission?: boolean;
    vatStatus?: VatStatus;
    vatValidationDate?: string;
  };
  selfCertification?: {
    dataCollectionStatus: 'COMPLETE' | 'INCOMPLETE';
    issues?: QuestionnaireIssue[];
    needsResubmission?: boolean;
  };
};
```

**TIN validation status (W-9):** `PENDING`, `VALID_SSN_MATCH`, `VALID_EIN_MATCH`, `VALID_SSN_EIN_MATCH`, `MISMATCH`, `TIN_NOT_ISSUED`, `INVALID_DATA`, `FOREIGN`, `ERROR`

**VAT validation status (DPS):** `PENDING`, `VALID`, `INVALID`, `INSUFFICIENT_DATA`, `NOT_REQUIRED`, `NON_EU`

Statuses also carry expiration dates (3 years from submission) and issues requiring resubmission.

## Curing W-8 Issues

`TaxbitCuringDocumentation` clears specific W-8 validation issues **without re-submitting the whole form**. Gate it on `useTaxbit().needsCuringDocumentation`. Usage, the reasonable-explanation flow, demo/region/proxy options, and the `QuestionnaireIssue` / `IssueType` values: [reference/curing.md](reference/curing.md).

## TaxbitTaxResidencies

A standalone widget (v4+) that collects only a list of tax residencies (country + TIN), independent of the full questionnaire. Props and example: [reference/tax-residencies.md](reference/tax-residencies.md).

## onProgress Callback

`onProgress` reports the user's position in the multi-step form: `percentComplete` is a whole number from 0 to 100 (not 0–1), plus `stepNumber`, `totalSteps`, and the current step id. The type and step ids: [reference/on-progress.md](reference/on-progress.md).

## Regional & Proxy Configuration

- **Staging:** add `staging` (with a staging-minted token) to `TaxbitQuestionnaire`, `useTaxbit`, and `TaxbitCuringDocumentation`; it targets `api.multi1.enterprise-staging.taxbit.com`.
- **EU tenants:** add `region="EU"` to the component (and mint the token against the EU token endpoint).
- **Proxied networks:** set `proxyDomain` (and optional `proxyHeaders`) to route SDK API calls through your own gateway. Your proxy must set the `authorization` and `content-type` headers itself — they are reserved. `proxyDomain` and `region`/`staging` are mutually exclusive.

## CSS / Styling & Customization

The SDK's CSS is minimal and meant to be replaced; the stable `taxbit-*` class names are the contract. On 6.0.0+, **theme colors with the 17 `--taxbit-color-*` custom properties** that `inline.css` and `basic.css` declare on `:root` (for example `--taxbit-color-primary`); they're the only `--taxbit-*` properties, so don't invent spacing or font tokens. For anything else, override the `taxbit-*` classes in your own CSS, imported after any base stylesheet (a base is optional). On 5.x there are no custom properties; use class overrides only. Per-field error text has no class of its own: use `.taxbit-question-<field> .taxbit-error-message`. The property list with defaults, the class reference, button order, and examples: [reference/styling.md](reference/styling.md).

## Supported Languages

50+ locale codes; base codes (`de`, `fr`) and regional variants (`fr-ca`) both work. `W-FORM` supports a smaller set than `DPS` and `SELF-CERT`. The full lists: [reference/languages.md](reference/languages.md).

## Content Security Policy

If your app uses CSP headers, add:

```
connect-src https://*.taxbit.com;
```

If you use `proxyDomain`, allow your proxy host instead.

## Demo Mode

Set `demoMode={true}` for local development without a backend. No bearer token needed. Simulates real-time TIN validation using the last digit of the entered TIN (0 = valid, 6 = invalid, others = pending). For curing, use `demoIssueTypes` on `TaxbitCuringDocumentation` instead.

## Security

The SDK handles tax documentation PII (TINs, addresses, dates of birth), subject to IRC 6103 and possibly GDPR. The essentials:

- Get the account-owner token server-side only; the `client_secret` never reaches the browser. Keep the token in memory or an httpOnly cookie, never `localStorage` or URL parameters.
- Never log the `bearerToken`, or data from `onProgress`, `onSubmit`, `onSuccess`, or the curing callbacks.
- Treat the adaptive-mode `data` prop as sensitive; don't persist it client-side.
- Add `connect-src https://*.taxbit.com;` to your CSP.

The full checklist (PII handling, git, secrets, monitoring, local environment, automation boundaries): [reference/security.md](reference/security.md).

## Common Integration Patterns

1. **Token management** — fetch the account-owner-scoped token server-side, pass it to the React app, and refresh before expiry (remount via `key` after a 401).
2. **Progress tracking** — use `onProgress` to show a custom progress bar or save the user's position.
3. **Post-submission flow** — use `onSuccess` to navigate to a confirmation page or update your app's state.
4. **Status checking** — use `useTaxbit` to check whether a user has already completed documentation before showing the form (check `isLoading` first to avoid flicker).
5. **Curing** — gate `TaxbitCuringDocumentation` on `needsCuringDocumentation`, and call `refresh()` after a successful cure.
6. **PDF generation** — use `generateDocumentUrl` from `useTaxbit` to let users download their submitted W-Form or Self-Cert forms (not available for DPS).

## Full Documentation

- Integration guide: https://apidocs.taxbit.com/docs/integration-guide
- Component & hook reference: https://apidocs.taxbit.com/docs/component-and-hook-reference
- Curing integration guide: https://apidocs.taxbit.com/docs/curing-integration-guide
- Handling token expiration: https://apidocs.taxbit.com/docs/handling-token-expiration
- Tax documentation FAQ: https://apidocs.taxbit.com/docs/tax-documentation-guide
