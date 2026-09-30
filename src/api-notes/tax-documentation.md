Every submission is **immutable** — each POST creates a new record. Two path scopes exist for the same operations:
- **Path-scoped** (tenant token): `/account-owners/{id}/tax-documentation-data/...`
- **Token-scoped** (account-owner token): same paths **without** `/account-owners/{id}` — the account owner is derived from the JWT. These are the variants the React SDK / browser flows use.

All form POSTs return **201** and mirror the submitted body.

**W-8IMY has a submission endpoint.** Its reference page lives at the non-standard slug `reference/taxdocumentationcontroller_submitw8imy.md`, which is why earlier revisions of this skill wrongly claimed no such endpoint existed. The body is `W8ImySubmissionDto`: 76 properties, but only `irs_version` is required. Notable fields are a 9-value `tax_classification`, `ein_type` (`EIN`, `QI_EIN`, `WP_EIN`, `WT_EIN`), its own **26-value** `fatca_classification` (a different set from W-8BEN-E's 32), `giin` with `giin_applied_for` and `sponsoring_entity_or_trustee_name`, `nonreporting_iga_country_model` and `nonreporting_iga_trustee_type`, `securities_market`, `affiliate_entity_name`, and the full IRS checkbox range `box_14` through `box_42` (booleans, plus string dates `box_35_date_of_formation` and `box_36_date_of_filing`).

**W-8BEN-E caveat:** its FATCA block and all `box_*` fields exist **only** on the `irs_version` variant, not on the substitute-form variant.

W-8BEN has no `limitation_on_benefits`; W-8BEN-E adds the entity treaty fields `treaty_claim_i_certify_requirements` and `treaty_claim_limitation_on_benefits`.

Root: `days_since_establishment`, plus per-form sections `w_form_questionnaire`, `dps_questionnaire`, `self_certification`. (`submission_status` and `DAC7_interview` are **deprecated** — use `dps_questionnaire` for DAC7/DPS.)

- `w_form_questionnaire`: `type` (`W-9`/`W-8BEN`/`W-8BEN-E`), `data_collection_status` (`COMPLETE`/`INCOMPLETE`), `tin_status` (`PENDING`, `INVALID_DATA`, `VALID_SSN_MATCH`, `VALID_EIN_MATCH`, `VALID_SSN_EIN_MATCH`, `MISMATCH`, `TIN_NOT_ISSUED`, `ERROR`), `tax_documentation_status` (`VALID`/`INVALID`), `treaty_claim_status`, `expiration_date`, `tin_validation_date`, `needs_resubmission`, `issues[]`.
- `dps_questionnaire`: `vat_status` (`PENDING`, `VALID`, `INVALID`, `INSUFFICIENT_DATA`, `NOT_REQUIRED`, `NON_EU`), plus the common status/expiration/`issues` fields.
- `self_certification`: `tax_documentation_status`, `data_collection_status`, `needs_resubmission`, `issues[]`.

**Issue object:** `issue_type`, `status` (`OPEN`/`IN_REVIEW`/`RESOLVED`), `created_at`, `details`. `issue_type` values: `CHANGE_IN_CIRCUMSTANCES`, `CARE_OF_PERMANENT_ADDRESS`, `PO_BOX_PERMANENT_ADDRESS`, `US_PERMANENT_ADDRESS`, `TREATY_COUNTRY_MISMATCH`, `US_INDICIA`, `WITHHOLDING_DOCUMENTATION`, `INCOMPLETE_ADDRESS`, `INCOMPLETE_DATA`, `INCONSISTENT_DATA`, `INCOMPLETE_CLASSIFICATION`, `INCOMPLETE_US_TIN`, `INCOMPLETE_TREATY_CLAIM`, `INCOMPLETE_GIIN`, `CBI_RBI_CONFIRMATION`. (Curing of open W-8 issues is handled client-side via the React SDK `TaxbitCuringDocumentation` component.)

- `POST .../document` body: `document_type` (`W-9`, `W-8BEN`, `W-8BEN-E`, `W-8IMY`, `SELF_CERTIFICATION`). Returns `id`, `type`, `status` (`PROCESSING`/`FINISHED`/`ERROR`), `url` (present once `FINISHED`). Poll `GET .../document/{document-id}` until `FINISHED`.
- `GET .../tax-documentation-data` supports `unmask=true` to return unmasked TINs.
