Transactions use an **upsert** pattern. `POST /transactions/external-id` is a static path — the external transaction id goes in the request body as `id`, **not** in the URL. The GET and DELETE singles **do** take it in the path.

**The write and read `type` vocabularies differ.** Submissions use the lowercase list below. Responses return a different, UPPERCASE set: `TRADE`, `BUY`, `SELL`, `TRANSFER`, `TRANSFER-IN`, `TRANSFER-OUT`, `INTERNAL-TRANSFER`, `ACQUISITION`, `FOREX`, `INCOME`, `EXPENSE`, `GIFT-RECEIVED`, `GIFT-SENT`, `INVALID`, `REWARD`, `ADJUSTMENT`, `STAKE`, `UNSTAKE`, `COST-BASIS-TRANSFER`. Do not round-trip a response `type` back into a submission. Subtypes are the same lowercase list in both directions.

`withholdings[]` items: `regime_type` (`us-federal`, `us-state`, `eu-dac7`), `state` (2-char, required if `us-state`), `asset_amount`, `rates`. Response: `{ "status": "success", "message": "Transaction post successful." }`.
