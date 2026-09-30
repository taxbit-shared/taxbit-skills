<!-- Moved from skills/react-sdk/SKILL.md; regenerate with it (see CLAUDE.md). -->

# Upgrading to 5.0.0

5.0.0 is a major release. Four things break existing integrations.

1. **`typesOfIncome` is now required whenever `treatyClaims` is `true`.** Omitting it, or passing a value outside the supported set, **throws at initialization**. Values are validated, not normalized.
2. **`fatca: false` combined with `typesOfIncome` containing `INTEREST` or `DIVIDENDS` throws.** Those payment types require a Chapter 4 status. Either omit `fatca`, which resolves to `true`, or drop those income types.
3. **The `TypeOfIncome` value set changed.** `SERVICES` is gone. `INTEREST`, `DIVIDENDS`, `OTHER_INCOME`, and `ROYALTIES_MOTION_PICTURE_AND_TV` are new. Separators are tolerant, so `ROYALTIES_OTHER` and `ROYALTIES-OTHER` both work, but **case is not folded** and `royalties-other` throws.
4. **`useTaxbitStatus` is now a public export with a changed signature.** Code deep-importing the old internal path will break. It drops `questionnaire` and `prepopulateWithSavedData` from its props, drops `serverData`, `refresh`, and `refreshSubmission` from its return, and adds `needsCuringDocumentation`.

Also new, without breaking anything: the `fatca` prop for Chapter 4 collection, real-time GIIN validation against the IRS FFI list, a new `substantialUsOwners` step id, a `config` object recorded on submissions, and localized certification dates. Submissions now stamp `schema_version: "5"`.

**There are no CSS or DOM changes between 4.x and 5.0.0** (6.0.0 does change them; see [upgrading-to-6.md](upgrading-to-6.md)). The package's own changelog carries a CSS breaking-change table, but those renames happened back in 4.0.0. Every stylesheet and every `taxbit-*` class is byte-identical across 4.0.0, 4.1.0, and 5.0.0.
