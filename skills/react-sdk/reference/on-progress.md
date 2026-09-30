<!-- Moved from skills/react-sdk/SKILL.md; regenerate with it (see CLAUDE.md). -->

# onProgress Callback

Tracks the user's position in the multi-step form:

```typescript
type Progress = {
  language: string;      // Locale
  percentComplete: number; // integer 0–100 (not 0–1): 0 on the first step, 100 on the last
  stepId: string;        // StepId
  stepIndex: number;     // 0-based
  stepNumber: number;    // 1-based
  stepTitle: string;     // localized
  steps: string[];       // StepId[]
  totalSteps: number;
};
```

`percentComplete` is `Math.round(stepIndex / (steps.length - 1) * 100)`: a whole-number percentage that moves in even steps by position, not by how many questions each step has (verified in the 5.0.0 and 6.0.0 bundles). Use it directly as a percentage, e.g. `width: ${progress.percentComplete}%`. The step list is recomputed from the answers so far, so `totalSteps` and the percentage can change as the user answers. For "Step N of M", use `stepNumber` and `totalSteps`.

**Common step IDs:** `accountHolderClassification`, `accountHolderContactInformation`, `accountHolderTaxInformation`, `accountHolderTaxResidenciesConfirmation` (SELF-CERT), `accountHolderCertifications`, `accountHolderTreatyClaims`, `accountHolderUsTinValidation`, `accountHolderAdditionalInfo`, `exemptions`, `regardedOwnerClassification`, `regardedOwnerContactInformation`, `regardedOwnerTaxInformation`, `regardedOwnerCertifications`, `regardedOwnerTreatyClaims`, `regardedOwnerUsTinValidation`, `confirmation`, `summary`
