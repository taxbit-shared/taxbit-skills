A filer is the legal entity responsible for filing tax forms with tax authorities. Tenants may have multiple filers, one marked `is_default: true`. (Filers replace the former "Payers" concept — Payers endpoints no longer exist.) Only `name` is required to create one; other fields are needed to generate specific form types.

`DELETE` returns **409** if the filer is the default or has associated accounts.

**Response** includes all submitted fields plus system-generated: `id` (UUID), `tenant_id` (UUID), `date_created`, `date_modified`, `is_default`, `vat_id_masked`.
