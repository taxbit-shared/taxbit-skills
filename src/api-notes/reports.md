Asynchronous bulk report generation. Trigger a report, poll for completion, then download from a pre-signed URL.

- POST body: `as_of_timestamp` (ISO-8601 UTC, **required**), `account_ids` (optional array, max 10,000; omit for all accounts). Returns **202** with `report_id` and `status: "pending"`.
- GET returns `status` (`pending`/`processing`/`completed`/`failed`); when `completed`, includes `download_url` (pre-signed, valid **15 minutes** — re-GET for a fresh one), `completed_at`, `expires_at`, and `metadata`. Reports are retained **30 days**.
