<!-- Moved from skills/react-sdk/SKILL.md; regenerate with it (see CLAUDE.md). -->

# Curing W-8 Issues (TaxbitCuringDocumentation)

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

## Issue types

```ts
type QuestionnaireIssue = {
  issueType: IssueType;
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED';
  createdAt: string;
  details: { field: string; description: string }[];
};
```

**IssueType values:** `CARE_OF_PERMANENT_ADDRESS`, `PO_BOX_PERMANENT_ADDRESS`, `US_PERMANENT_ADDRESS`, `TREATY_COUNTRY_MISMATCH`, `US_INDICIA`, `WITHHOLDING_DOCUMENTATION`, `CHANGE_IN_CIRCUMSTANCES`, `INCOMPLETE_DATA`, `INCONSISTENT_DATA`, `INCOMPLETE_ADDRESS`, `INCOMPLETE_CLASSIFICATION`, `INCOMPLETE_US_TIN`, `INCOMPLETE_TREATY_CLAIM`, `CBI_RBI_CONFIRMATION`, `INCOMPLETE_GIIN`
