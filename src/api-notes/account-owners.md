- Set `tax_residencies` or `controlling_persons` to `null` on PATCH to clear all existing entries.
- The flat `tin` / `tin_type` / `tax_country_code` fields are **deprecated** — use `us_tin`/`us_tin_type` and `tax_residencies`.
- An `account` object can be nested inside account owner creation to create both simultaneously.
- Response wraps the object under `data` with server fields: `taxbit_id` (UUID), `tenant_id`, `date_created`, and masked TIN values.

**TIN validation status (`GET .../us-tin-validation-status`)** — `status` values: `PENDING`, `FOREIGN`, `INVALID_DATA`, `VALID_SSN_MATCH`, `VALID_EIN_MATCH`, `VALID_SSN_EIN_MATCH`, `TIN_NOT_ISSUED`, `MISMATCH`, `UNPROCESSED`. Plus `validation_date`.
