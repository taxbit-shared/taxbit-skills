<!-- Moved from skills/react-sdk/SKILL.md; regenerate with it (see CLAUDE.md). -->

# onProgress Callback

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
