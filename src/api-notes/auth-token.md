**The two tokens last different lengths of time.** A tenant-scoped token (`POST /oauth/token`) is valid for **24 hours** (`expires_in: 86400`). An account-owner-scoped token (`POST /oauth/account-owner-token`) is valid for **1 hour** (`expires_in: 3600`). Schedule refresh from each response's `expires_in` rather than a fixed lifetime, and on a `401`, mint a new token and retry once.

Both requests accept a JSON body. For the account-owner token, send the account owner's external `id`; `account_owner_id` (the Taxbit UUID) is the deprecated alias.
