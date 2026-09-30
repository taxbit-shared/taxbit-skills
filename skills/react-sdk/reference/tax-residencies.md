<!-- Moved from skills/react-sdk/SKILL.md; regenerate with it (see CLAUDE.md). -->

# TaxbitTaxResidencies

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
