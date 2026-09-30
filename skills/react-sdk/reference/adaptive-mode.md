<!-- Moved from skills/react-sdk/SKILL.md; regenerate with it (see CLAUDE.md). -->

# Adaptive Mode

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
