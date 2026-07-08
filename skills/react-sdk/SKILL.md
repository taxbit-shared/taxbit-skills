---
name: react-sdk
description: Helps developers integrate the Taxbit React SDK for collecting tax documentation forms (W-9, W-8BEN, W-8BEN-E, W-8IMY, self-certification, DAC7/DPS, CRS, CARF, DAC8) and curing W-8 validation issues. Use when writing React code that imports @taxbit/react-sdk, renders TaxbitQuestionnaire, TaxbitCuringDocumentation, or TaxbitTaxResidencies, uses the useTaxbit hook, or handles tax form collection UI. For lookups/validators/types (@taxbit/utilities), use the utilities skill.
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
- **Latest version:** `4.0.0`
- **Install:** `npm i @taxbit/react-sdk`
- **Compatibility:** React 16–19 (peer dependency), TypeScript 5+ (type definitions bundled — no separate `@types` package needed)

## What It Does

The SDK provides a multi-step questionnaire UI that collects and submits tax documentation to Taxbit's API. It handles form logic, validation, localization (50+ locales), and submission. As of v4 it also ships `TaxbitCuringDocumentation`, a focused flow for resolving specific W-8 validation issues without re-submitting the whole form. The integrator embeds the components and handles auth tokens and callbacks.

## Exports

```tsx
import {
  TaxbitQuestionnaire,        // full multi-step tax form
  TaxbitCuringDocumentation,  // targeted W-8 issue remediation (v4+)
  TaxbitTaxResidencies,       // standalone tax-residency collection widget (v4+)
  useTaxbit,                  // read status/data, generate PDF URLs
} from '@taxbit/react-sdk';
import '@taxbit/react-sdk/style/inline.css';
```

**Re-exported types:** `Region` (`'US' | 'EU'`), `Locale`, `Progress`, `ClientTaxDocumentationStatus`, and — passed through from `@taxbit/utilities` — `ClientTaxDocumentation` and `ClientTaxResidency`. Import these for typing the `data` prop and callback payloads. For the full lookups/validators/types toolkit, use the **utilities** skill (`@taxbit/utilities`).

## Quick Start (Demo Mode)

No token or backend needed — great for local development:

```tsx
import { TaxbitQuestionnaire } from '@taxbit/react-sdk';
import '@taxbit/react-sdk/style/inline.css';

export default function App() {
  return <TaxbitQuestionnaire questionnaire="W-FORM" demoMode={true} />;
}
```

Set `questionnaire` to `"DPS"` or `"SELF-CERT"` to test other forms. Callbacks still fire in demo mode so you can inspect data.

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

| Value         | Purpose                                                                                              |
| ------------- | ---------------------------------------------------------------------------------------------------- |
| `"W-FORM"`    | Collects W-9 (US persons) or W-8BEN / W-8BEN-E / W-8IMY (non-US persons) for 1099 reporting and FDAP withholding compliance |
| `"DPS"`       | Digital Platform Seller — DAC7 (EU), UK, NZ, and Canada MRDP obligations                             |
| `"SELF-CERT"` | CRS, CARF, DAC8 self-certification per OECD guidance                                                  |

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

| Prop                       | Type                                    | Required | Default                           | Description                                                            |
| -------------------------- | --------------------------------------- | -------- | --------------------------------- | ---------------------------------------------------------------------- |
| `bearerToken`              | string                                  | Yes*     | —                                 | Account-owner-scoped token. *Not required when `demoMode` is true      |
| `questionnaire`            | `'W-FORM' \| 'DPS' \| 'SELF-CERT'`      | Yes      | —                                 | Form type to render                                                    |
| `data`                     | `ClientTaxDocumentation`                | No       | —                                 | Pre-collected data; overrides server data if both exist (see Adaptive Mode) |
| `adaptiveMode`             | `'full' \| 'skipLock' \| 'skipEdit'`    | No       | `'full'`                          | Behavior with pre-filled / prior data                                  |
| `prepopulateWithSavedData` | boolean                                 | No       | `true`                            | Fetch the prior submission on mount; set `false` to skip server prefill |
| `language`                 | string (locale)                         | No       | `'en-us'` (W-FORM), `'en-gb'` (DPS/SELF-CERT) | Pre-select form language                                    |
| `treatyClaims`             | boolean                                 | No       | `false`                           | W-FORM only: enable treaty claim questions in W-8 flows                |
| `realTimeTinValidation`    | boolean                                 | No       | `false`                           | W-FORM only: validate name/TIN against IRS in real time (W-9)          |
| `region`                   | `'US' \| 'EU'`                          | No       | `'US'`                            | Route requests to the selected Taxbit region                           |
| `dateFormat`               | `'mdy' \| 'dmy' \| 'ymd'`               | No       | `'mdy'`                           | Date picker order                                                      |
| `demoMode`                 | boolean                                 | No       | `false`                           | Render without server communication; no token needed                   |
| `proxyDomain`              | string                                  | No       | —                                 | Route API calls through your own proxy (mutually exclusive with `region`) |
| `proxyHeaders`             | `Record<string, string>`                | No       | —                                 | Extra headers for the proxy (`authorization` / `content-type` reserved) |
| `poweredByTaxbit`          | boolean                                 | No       | `false`                           | Show "Powered by Taxbit" footer                                        |
| `loadingComponent`         | ReactNode                               | No       | "Retrieving interview status…"    | Custom loading UI                                                      |
| `onProgress`               | `(progress: Progress) => void`          | No       | —                                 | Fires on navigation (Next, Back, Cancel, Submit)                       |
| `onSubmit`                 | `(data: ClientTaxDocumentation) => void`| No       | —                                 | Fires after client-side validation, before the API completes          |
| `onSuccess`                | `(data: ClientTaxDocumentation) => void`| No       | —                                 | Fires after a successful API submission                                |
| `onError`                  | `(error: Error) => void`                | No       | Logs to console                   | Fires on submission error                                              |
| `onSettled`                | `(data: ClientTaxDocumentation) => void`| No       | —                                 | Fires after `onSuccess` or `onError`                                   |

## Adaptive Mode

Adaptive mode pre-fills form data and skips questions the user doesn't need to answer. Enable it with `adaptiveMode` and pass known data via `data`.

```tsx
<TaxbitQuestionnaire
  bearerToken={token}
  questionnaire="W-FORM"
  adaptiveMode="skipLock"
  data={{
    accountHolder: {
      isUsPerson: true,
      usAccountType: "INDIVIDUAL",
      name: "Jane Doe",
      tin: "776568989",
      address: {
        firstLine: "123 Main St",
        city: "Seattle",
        stateOrProvince: "WA",
        postalCode: "98101",
        country: "US"
      }
    }
  }}
/>
```

**Modes:**
- `"full"` — supplied data pre-fills but all questions remain visible (default)
- `"skipLock"` — valid pre-filled fields are skipped and locked on the review screen
- `"skipEdit"` — valid pre-filled fields are skipped but remain editable on review

**Data rules:**
- Valid, complete field → question is skipped
- Empty string `""` → signals "user was asked and declined" (skips optional fields without locking)
- Field omitted → optional fields skipped, required fields still shown
- Invalid data → question is shown so the user can correct it

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

**Parameters:** `bearerToken` (required), `questionnaire` (required), `onError`, `region`, `proxyDomain`, `proxyHeaders`.

**Return values:**

| Return                     | Type                                       | Description                                                        |
| -------------------------- | ------------------------------------------ | ------------------------------------------------------------------ |
| `statusData`               | `ClientTaxDocumentationStatus \| undefined`| Documentation status for this account owner                        |
| `serverData`               | `ClientTaxDocumentation \| undefined`      | Last submitted data                                                |
| `error`                    | `Error \| undefined`                       | Fetch or token error                                               |
| `isLoading`                | boolean                                    | True while the status fetch is in flight                           |
| `needsCuringDocumentation` | boolean                                    | True when the user has ≥1 `OPEN` curable W-Form issue              |
| `canGetDocumentUrl`        | boolean                                    | True once W-Form or Self-Cert is `COMPLETE` (always false for DPS) |
| `generateDocumentUrl`      | `() => void`                               | Triggers PDF URL generation                                        |
| `isGeneratingDocumentUrl`  | boolean                                    | True while URL generation is in flight                             |
| `documentUrl`              | `string \| undefined`                      | Temporary PDF URL; refreshed roughly every 4 minutes               |
| `refresh`                  | `() => Promise<void>`                      | Re-fetch status + submission                                       |
| `refreshStatus`            | `() => Promise<void>`                      | Re-fetch status only                                               |
| `refreshSubmission`        | `() => Promise<void>`                      | Re-fetch submission only                                           |

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

## Curing W-8 Issues (TaxbitCuringDocumentation)

Curing is a focused remediation flow for clearing specific W-8 validation issues **without re-submitting the entire form**. Gate it on `useTaxbit().needsCuringDocumentation`.

```tsx
import { useTaxbit, TaxbitCuringDocumentation } from '@taxbit/react-sdk';

function CuringPage({ bearerToken }) {
  const { needsCuringDocumentation, isLoading, refresh } = useTaxbit({
    bearerToken,
    questionnaire: 'W-FORM',
  });

  if (isLoading) return <Spinner />;           // always check isLoading first
  if (!needsCuringDocumentation) return null;

  return (
    <TaxbitCuringDocumentation
      bearerToken={bearerToken}
      onSuccess={async () => { await refresh(); }}
      onError={(err) => reportToMonitoring(err)}
    />
  );
}
```

**When curing applies:** the user has a `COMPLETE` W-8 submission with ≥1 issue whose `status` is `OPEN` and whose `issueType` is curable. If the issue isn't curable (e.g. address-shape issues on an individual W-8BEN), route the user back through `TaxbitQuestionnaire` with `adaptiveMode="skipEdit"` instead.

**Curable issue types** (`CurableIssueType`): `US_INDICIA`, `TREATY_COUNTRY_MISMATCH`, `CARE_OF_PERMANENT_ADDRESS`, `PO_BOX_PERMANENT_ADDRESS`. Availability varies by form: `US_INDICIA` applies to W-8BEN, W-8BEN-E, and W-8IMY; `TREATY_COUNTRY_MISMATCH` to W-8BEN and W-8BEN-E; the address issues to W-8BEN-E and W-8IMY.

**Props** — three mutually exclusive configurations:

- **Demo:** `demoIssueTypes: CurableIssueType[]` (required), `onSubmit`. No token/network; issues assume `OPEN` status and W-8BEN-E doc type.
- **Region (default):** `bearerToken` (required), `region` (`'US' | 'EU'`, default `'US'`), `staging` (boolean, default `false`), `loadingComponent`, `onSuccess`, `onError`, `onSettled`.
- **Proxy:** `proxyDomain` (required), `proxyHeaders`, plus the same callbacks. Mutually exclusive with `region`/`staging`.

Common to all: `language` (Locale, default `en-us`), `poweredByTaxbit` (default `false`).

**Reasonable-explanation flow:** open `US_INDICIA` issues prompt the user to pick a `ReasonableExplanationType` — `STUDENT`, `TEACHER_OR_TRAINEE`, `DIPLOMAT`, `SPOUSE_OR_CHILD`, `DO_NOT_MEET_SUBSTANTIAL_PRESENCE_TEST` (reveals day-count fields), or `CLOSER_CONNECTION_EXCEPTION` (reveals country + reason fields).

**Important behavior:**
- `onSuccess` fires when the server accepts the upload — **not** when re-review completes. A cured `OPEN` issue moves to `IN_REVIEW`; while `IN_REVIEW` the widget renders `null` and the user cannot resubmit. Call `useTaxbit().refresh()` in `onSuccess` before reading derived state.
- No `onProgress` callback and no PDF download for curing submissions.
- W-9 forms never surface curable issues.

### Issue types

```ts
type QuestionnaireIssue = {
  issueType: IssueType;
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED';
  createdAt: string;
  details: { field: string; description: string }[];
};
```

**IssueType values:** `CARE_OF_PERMANENT_ADDRESS`, `PO_BOX_PERMANENT_ADDRESS`, `US_PERMANENT_ADDRESS`, `TREATY_COUNTRY_MISMATCH`, `US_INDICIA`, `WITHHOLDING_DOCUMENTATION`, `CHANGE_IN_CIRCUMSTANCES`, `INCOMPLETE_DATA`, `INCONSISTENT_DATA`, `INCOMPLETE_ADDRESS`, `INCOMPLETE_CLASSIFICATION`, `INCOMPLETE_US_TIN`, `INCOMPLETE_TREATY_CLAIM`, `CBI_RBI_CONFIRMATION`, `INCOMPLETE_GIIN`

## TaxbitTaxResidencies

A standalone widget (v4+) that collects just a list of tax residencies (country + TIN), independent of the full questionnaire — useful when you only need to gather or update residency data.

```tsx
import { TaxbitTaxResidencies } from '@taxbit/react-sdk';
import type { ClientTaxResidency } from '@taxbit/react-sdk';

<TaxbitTaxResidencies
  data={existingResidencies}                 // optional ClientTaxResidency[]
  language="en-us"                            // optional
  poweredByTaxbit={true}                      // optional
  onSubmit={(residencies: ClientTaxResidency[]) => save(residencies)}
/>
```

| Prop              | Type                                   | Required | Description                                    |
| ----------------- | -------------------------------------- | -------- | ---------------------------------------------- |
| `onSubmit`        | `(data: ClientTaxResidency[]) => void` | Yes      | Called with the collected tax residencies      |
| `data`            | `ClientTaxResidency[]`                 | No       | Pre-fill existing residencies                  |
| `language`        | string (locale)                        | No       | Pre-select form language                       |
| `poweredByTaxbit` | boolean                                | No       | Show "Powered by Taxbit" footer                |

This widget submits to your `onSubmit` handler rather than posting to Taxbit itself — you own persistence.

## onProgress Callback

Tracks the user's position in the multi-step form:

```typescript
type Progress = {
  language: string;      // Locale
  percentComplete: number;
  stepId: string;        // StepId
  stepIndex: number;     // 0-based
  stepNumber: number;    // 1-based
  stepTitle: string;     // localized
  steps: string[];       // StepId[]
  totalSteps: number;
};
```

**Common step IDs:** `accountHolderClassification`, `accountHolderContactInformation`, `accountHolderTaxInformation`, `accountHolderTaxResidenciesConfirmation` (SELF-CERT), `accountHolderCertifications`, `accountHolderTreatyClaims`, `accountHolderUsTinValidation`, `accountHolderAdditionalInfo`, `exemptions`, `regardedOwnerClassification`, `regardedOwnerContactInformation`, `regardedOwnerTaxInformation`, `regardedOwnerCertifications`, `regardedOwnerTreatyClaims`, `regardedOwnerUsTinValidation`, `confirmation`, `summary`

## Regional & Proxy Configuration

- **EU tenants:** add `region="EU"` to the component (and mint the token against the EU token endpoint).
- **Proxied networks:** set `proxyDomain` (and optional `proxyHeaders`) to route SDK API calls through your own gateway. Your proxy must set the `authorization` and `content-type` headers itself — they are reserved. `proxyDomain` and `region`/`staging` are mutually exclusive.

## CSS / Styling

Import one built-in stylesheet, then override with your own CSS:
- `@taxbit/react-sdk/style/inline.css` — complete default styling
- `@taxbit/react-sdk/style/basic.css` — minimal structural styling
- `@taxbit/react-sdk/style/minimal.css` — bare minimum; your app globals take over

Both `TaxbitQuestionnaire` and `TaxbitCuringDocumentation` use the same `taxbit-*` namespaced CSS classes, so a single import styles both and brand overrides apply to both.

## Supported Languages

The SDK ships 50+ locale codes. Passing a base language code (e.g. `de`, `fr`, `pt`, `zh`, `nl`, `el`) works, as do region-specific variants.

**W-FORM** supports a smaller set focused on major markets (German, English, Spanish, French, Indonesian, Italian, Japanese, Korean, Malay, Dutch, Polish, Portuguese, Romanian, Russian, Thai, Turkish, Vietnamese, Chinese).

**DPS & SELF-CERT** support the full EU/OECD-oriented set — all W-FORM languages plus Bulgarian, Czech, Danish, Greek, Estonian, Finnish, Croatian, Hungarian, Irish, Lithuanian, Latvian, Maltese, Norwegian, Slovak, Slovenian, Swedish, Ukrainian, and more.

Full locale list: `bg`, `cs`, `da`, `de`, `de-at`, `de-de`, `el`, `el-cy`, `el-gr`, `en`, `en-gb`, `en-nz`, `en-us`, `es`, `es-es`, `es-mx`, `et`, `fi`, `fr`, `fr-ca`, `fr-fr`, `fr-lu`, `ga`, `hr`, `hu`, `id`, `it`, `ja`, `ko`, `lt`, `lv`, `ms`, `mt`, `nl`, `nl-be`, `nl-nl`, `no`, `pl`, `pt`, `pt-br`, `pt-pt`, `ro`, `ru`, `sk`, `sl`, `sv`, `th`, `tr`, `uk`, `vi`, `zh`, `zh-cn`, `zh-tw`.

## Content Security Policy

If your app uses CSP headers, add:

```
connect-src https://*.taxbit.com;
```

If you use `proxyDomain`, allow your proxy host instead.

## Demo Mode

Set `demoMode={true}` for local development without a backend. No bearer token needed. Simulates real-time TIN validation using the last digit of the entered TIN (0 = valid, 6 = invalid, others = pending). For curing, use `demoIssueTypes` on `TaxbitCuringDocumentation` instead.

## Security

The SDK handles tax documentation containing PII (TINs, addresses, dates of birth). Tax data is subject to IRS regulations (IRC 6103) and potentially GDPR for non-US persons — this is not ordinary user data. Apply these practices in your React integration.

### Token Handling

- Never fetch the account-owner token client-side — the `client_secret` must stay on the server.
- Pass the token to your React app via a secure API endpoint, not through URL parameters or global variables.
- Store tokens in memory (React state/context) or httpOnly secure cookies — never in localStorage or sessionStorage (vulnerable to XSS).
- Implement proactive token refresh before the 24-hour expiry — don't wait for a failure. When refreshing after a 401, change the component `key` to force a clean remount (see Handling Token Expiration).

### PII Protection

- Never log the `bearerToken` prop value, even at debug level.
- Don't capture or log data from `onProgress`, `onSubmit`, `onSuccess`, or curing `onSuccess`/`onSettled` callbacks that may contain tax form data.
- If using `useTaxbit` to display status, only show the minimum needed (e.g. complete/incomplete) — don't expose raw `serverData` in the UI.
- The `data` prop for adaptive mode may contain TINs and addresses — treat it as sensitive and don't persist it client-side.
- Do not include tax data or PII in alert messages, Slack notifications, or dashboards.

### Content Security Policy

- Add `connect-src https://*.taxbit.com;` to your CSP headers (see CSP section above).
- Don't weaken CSP broadly (e.g. `connect-src *`) just to support the SDK.

### Git & Version Control

- Never commit bearer tokens, TINs, or `data` prop values used in adaptive mode. If a secret is accidentally committed, rotate it immediately — removing it from history is not sufficient.
- Always add `.env` to `.gitignore`. Use placeholder values like `<BEARER_TOKEN>` in example code.
- All changes should go through PRs with required checks. Agents should not commit directly to main or merge PRs without human review.

### Secrets in Code & Configuration

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
- For unattended or agentic runs, use restricted tool sets (e.g. read-only) to limit blast radius.
- If a generated script modifies multiple files or components, flag it for human review before execution.
- Ensure your app's data retention and access policies account for the sensitivity of tax documentation.

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
