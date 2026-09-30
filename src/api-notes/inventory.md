`/inventory` params: `account_id`, `asset_id` **or** `asset_code` (required), `offset`, `limit` (default 25), `include_summary` (default true), `price` (for unrealized gain/loss), `lots_ordered_by` (`HIFO`/`FIFO`/`LIFO`/`LOFO`). Lots are sorted by the requested disposition method.

**Transfer lots:** POST body: `effective_datetime` (optional), `transfer_lots[]` with `quantity`, `cost_basis` (≥0), `acquisition_transaction_datetime`. `POST` replaces any existing lots for the transaction.
