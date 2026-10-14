# Webhooks

From the [Webhooks guide](https://apidocs.taxbit.com/docs/webhooks-guide). `SKILL.md` keeps the rules a handler must not get wrong; this file has the details: delivery anatomy, authentication, a full handler, every event's payload, testing, and troubleshooting.

## Setup

Subscriptions are configured by Taxbit, not self-serve. The customer gives their implementation manager:

1. **An HTTPS endpoint URL.** One subscription delivers all its event types to one endpoint; separate endpoints need separate subscriptions.
2. **The event types** (see [Events](#events)). Changing them later is a configuration change on Taxbit's side, not instant.
3. **Whether the endpoint allowlists inbound IPs.** By default deliveries come from cloud addresses that change over time; a fixed egress address is available on request.
4. **Whether something in front of the endpoint needs HTTP authentication** (see [Authentication](#authentication)).
5. **Any delivery settings** that differ from the defaults.

Taxbit then sends the HMAC secret through a secure channel. Store it like any other credential, e.g. `TAXBIT_WEBHOOK_SECRET`.

### Delivery settings

| Setting | Default | Controls |
| --- | --- | --- |
| Rate limit | 300 requests/second | The fastest Taxbit delivers to the endpoint |
| Retry attempts | 2 | How many times a failed delivery is retried |
| Retry window | 1 hour | How long Taxbit keeps retrying an event |

Many subscriptions are provisioned with other values, commonly a lower rate limit and a much longer retry window. Have the customer confirm their three values in writing before go-live, and size the endpoint and the deduplication window against those, not the defaults.

## A delivery

```http
POST /your-webhook-endpoint HTTP/1.1
content-type: application/json
x-taxbit-signature: v1=<base64_hmac_signature>
x-taxbit-source: webhook
x-trace-id: <trace_id>

{
  "timestamp": "<timestamp>",
  "data": [
    { "event_type": "ACCOUNT_OWNER_TIN_VALIDATION", "...": "event fields" }
  ]
}
```

| Header | Meaning |
| --- | --- |
| `x-taxbit-signature` | HMAC signature of the payload; one or more, comma-separated. The only proof the request came from Taxbit |
| `x-trace-id` | Opaque delivery ID. Log it: Taxbit needs it to trace a delivery. Not always a UUID |
| `x-taxbit-source` | Always `webhook`, the same for every customer. A marker, **not a credential**; never authenticate with it. Not sent when basic auth is on |
| `authorization` | `Basic …`, only when the subscription uses basic auth |

- `timestamp` is when Taxbit **dispatched** the delivery, not when the event happened. Don't use it for ordering or business logic; use the event's own date fields (e.g. `validation_date`).
- `data` always holds exactly one event today. Iterate it anyway, so batching later doesn't break the handler.

## Authentication

Two independent layers:

1. **The payload signature, always on.** Proves the request came from Taxbit unmodified. It can't be turned off, and it's the layer to check.
2. **A connection credential, optional.** Lets a gateway or load balancer in front of the endpoint admit the request. Default is the `x-taxbit-source: webhook` marker; on request, HTTP Basic (`Authorization: Basic base64(username:password)`).

Basic auth **adds to** the signature; keep verifying the signature. A subscription holds one set of basic credentials with no overlap, so rotation is a scheduled cutover: agree a window with Taxbit Support, make the endpoint accept **both** old and new credentials, let Taxbit switch, confirm deliveries, then drop the old ones. Rejecting Taxbit's credentials with a `401` (rotated, expired, revoked) is the most common way subscriptions get permanently disabled.

## Verifying the signature

- HMAC-SHA256, keyed with the subscription's secret.
- Computed over the **JSON payload re-serialized**: parse the body, then hash `JSON.stringify(payload)`. This mirrors Taxbit's own implementation.
- Digest is **base64**, not hex, prefixed with `v1=`.
- The header may hold several comma-separated signatures; accept if **any** matches. Compare in constant time.

```javascript
const crypto = require('crypto');
const express = require('express');

const SECRET = process.env.TAXBIT_WEBHOOK_SECRET;
const app = express();

// True if any signature in the header matches, compared in constant time.
function isFromTaxbit(payload, header) {
  const expected = Buffer.from(
    'v1=' + crypto.createHmac('sha256', SECRET).update(JSON.stringify(payload)).digest('base64'),
  );
  return (header || '').split(',').some((candidate) => {
    const actual = Buffer.from(candidate.trim());
    // timingSafeEqual throws on a length mismatch, so check length first.
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  });
}

app.post('/webhooks/taxbit', express.json(), async (req, res) => {
  const traceId = req.get('x-trace-id');
  if (!isFromTaxbit(req.body, req.get('x-taxbit-signature'))) {
    // 400, never 401 or 403: an auth-class response can disable the subscription.
    alertTeam('Taxbit webhook signature failed', { traceId });
    return res.status(400).send('invalid signature');
  }
  for (const event of req.body.data) {
    await enqueue({ traceId, event }); // durable queue; process after responding
  }
  res.status(200).send('ok');
});
```

`alertTeam` and `enqueue` stand for the integrator's own alerting and durable queue.

**Signing secret rotation:** ask Taxbit Support to add a new secret. During rotation every delivery carries two signatures, so a handler that checks every signature keeps working while the stored secret is switched. Code that reads only the first signature, or matches the whole header string, breaks the moment rotation starts.

## Responding

| Situation | Return |
| --- | --- |
| Accepted (durably queued) | `200`–`299` |
| Down, deploying, or overloaded | `500`–`599` (retried) |
| Rate limiting Taxbit | `429`, and ask Taxbit Support to lower the subscription's rate limit |
| Invalid signature or malformed payload | `400`, and alert the team: it's a misconfiguration |
| Anything authentication-related | **Never `401`, `403` or `407`** |

An auth-class response can put the subscription into a **deauthorized** state: delivery stops and stays stopped after the cause is fixed, until Taxbit re-enables it by hand. This includes a WAF, API gateway, reverse proxy or rate limiter answering on the endpoint's behalf.

A timeout counts as a failure. Acknowledge as soon as the event is durably queued and process afterwards.

## Delivery guarantees

- **At least once.** The same event can arrive more than once, even after a `200` (e.g. the response was lost). Handlers must be idempotent; ask Taxbit Support which field to deduplicate on for each subscribed event type.
- **No ordering.** Events, even for the same account owner, can arrive out of order. Order by the event's own date fields and discard anything older than what's already applied.
- **Additive changes.** New fields and event types appear over time. Ignore unknown fields and event types; a strict schema that rejects them drops deliveries.
- **After retries run out,** the event is retained and Taxbit can replay it on request (not automatically). Contact Taxbit Support with the time range and `x-trace-id` values. Replays can resend events already received.

## Events

Every event object has `event_type` plus the fields below. Optional fields may be **absent** entirely, not `null`.

| Event | Fires when | Fits with |
| --- | --- | --- |
| `ACCOUNT_OWNER_TAX_DOCUMENTATION_STATUS` | Any change to an account owner's tax documentation state | Tax documentation, React SDK, curing |
| `TAX_DOCUMENTATION_TIN_VALIDATION` | A TIN match result for a specific tax documentation submission | Tax documentation, React SDK |
| `ACCOUNT_OWNER_TIN_VALIDATION` | A TIN match result for an account owner | Account owners |
| `RTTM_TIN_VALIDATION` | A real-time TIN validation request completes | Real-Time TIN Validation |
| `FORM_STATUS_UPDATE` | A tax form is generated, filed or deleted | Documents |
| `INVENTORY_UPDATE` | An account's transaction inventory changed | Inventory, gains |

There's no separate "form submitted" event: a tax documentation submission changes the account owner's state, which sends `ACCOUNT_OWNER_TAX_DOCUMENTATION_STATUS`.

### `ACCOUNT_OWNER_TAX_DOCUMENTATION_STATUS`

The account owner's **current** tax documentation state, sent whenever any of it changes: a submission, a status or issue change, a curing step (`OPEN` → `IN_REVIEW` → `RESOLVED`, or back to `OPEN`), an expiration or change in circumstances. Same data as `GET /account-owners/{id}/tax-documentation-status` and the React SDK's `useTaxbit().statusData`, in snake_case.

```json
{
  "event_type": "ACCOUNT_OWNER_TAX_DOCUMENTATION_STATUS",
  "account_owner_id": "<account_owner_id>",
  "w_form_questionnaire": {
    "data_collection_status": "<data_collection_status>",
    "type": "<document_type>",
    "needs_resubmission": false,
    "tax_documentation_status": "<tax_documentation_status>",
    "tin_status": "<tin_verification_status>",
    "tin_validation_date": "<tin_validation_date>",
    "expiration_date": "<expiration_date>",
    "treaty_claim_status": "<treaty_claim_status>",
    "issues": []
  },
  "dps_questionnaire": {
    "data_collection_status": "<data_collection_status>",
    "expiration_date": "<expiration_date>",
    "vat_status": "<vat_status>",
    "vat_validation_date": "<vat_validation_date>"
  },
  "self_certification": {
    "data_collection_status": "<data_collection_status>",
    "needs_resubmission": true,
    "tax_documentation_status": "<tax_documentation_status>",
    "issues": [
      {
        "issue_type": "<issue_type>",
        "created_at": "<created_at>",
        "details": [{ "field": "<field_name>", "description": "<validation_error_description>" }]
      }
    ]
  }
}
```

- `account_owner_id` is always present. Each sub-object is present **only if a submission of that kind is on file**; check for the key before reading it.
- `w_form_questionnaire`: `data_collection_status`, `type`, `needs_resubmission`, `tax_documentation_status`, `issues`. W-9 adds `tin_status` and `tin_validation_date`; W-8 adds `expiration_date` and `treaty_claim_status`.
- `dps_questionnaire`: `data_collection_status`, `expiration_date`, `vat_status`, `vat_validation_date`.
- `self_certification`: `data_collection_status`, `needs_resubmission`, `tax_documentation_status`, `issues`.
- `issues` is empty when nothing is wrong; each entry has `issue_type`, `created_at`, and `details` of `{ field, description }`.
- Status values are those of the status endpoint, listed in [reference/tax-documentation.md](reference/tax-documentation.md). The TIN events below use the same `<tin_verification_status>` values as `tin_status`.

The event carries the whole state, not what changed. Diff it against the last state stored for the account owner before notifying anyone or acting.

### `TAX_DOCUMENTATION_TIN_VALIDATION`

A TIN match result tied to one tax documentation submission. A W-9's TIN check finishes after submission; this reports the result.

```json
{
  "event_type": "TAX_DOCUMENTATION_TIN_VALIDATION",
  "tax_documentation_id": "<tax_documentation_id>",
  "account_owner_id": "<account_owner_id>",
  "account_owner_external_id": "<account_owner_external_id>",
  "status": "<tin_verification_status>",
  "validation_date": "<validation_date>"
}
```

All fields required. `account_owner_id` is a version 4 UUID; `account_owner_external_id` is the integrator's own ID; `validation_date` is ISO 8601.

### `ACCOUNT_OWNER_TIN_VALIDATION`

A TIN match result for an account owner.

```json
{
  "event_type": "ACCOUNT_OWNER_TIN_VALIDATION",
  "account_owner_id": "<account_owner_id>",
  "account_owner_external_id": "<account_owner_external_id>",
  "status": "<tin_verification_status>",
  "validation_date": "<validation_date>"
}
```

All fields required.

### `RTTM_TIN_VALIDATION`

The result of a real-time TIN validation request.

```json
{
  "event_type": "RTTM_TIN_VALIDATION",
  "validation_id": "<validation-request-id>",
  "status": "<tin_verification_status>",
  "validation_date": "<validation_date>"
}
```

All fields required. `validation_id` identifies the validation request.

### `FORM_STATUS_UPDATE`

```json
{
  "event_type": "FORM_STATUS_UPDATE",
  "organization_id": "<organization_id>",
  "account_id": "<account_id>",
  "alternate_account_id": "<alternate_account_id>",
  "form_type": "<form_type>",
  "tax_year": 2025,
  "status": "<form_status>"
}
```

- `alternate_account_id` is optional (absent if the integrator didn't supply one); the rest are required. `tax_year` is an integer.
- `form_type`: `1099_DA`, `1099_B`, `1099_DIV`, `1099_INT`, `1099_K`, `1099_MISC`, `1099_NEC`, `1099_R`, `1042_S`, `5498`, `DAC7`, `RMD_STATEMENT`, `GAIN_LOSS_SUMMARY`, `GAIN_LOSS_SUMMARY_PDF`, `TRANSACTION_SUMMARY`, `TRANSACTION_SUMMARY_PDF`.
- `status`: `Generated` (retrievable from `GET /accounts/{id}/tax-documents`), `Filed` (filed with the authority; contents unchanged), or `Deleted` (no longer retrievable; a filed form can't be deleted).

### `INVENTORY_UPDATE`

An account's inventory changed and downstream figures may need recalculating.

```json
{
  "id": "<event_id>",
  "event_type": "INVENTORY_UPDATE",
  "account_id": "<account_id>",
  "latest_transaction_datetime": "<latest_transaction_datetime>",
  "update_from_datetime": "<update_from_datetime>",
  "latest_transaction_id": "<transaction_id>",
  "update_from_transaction_id": "<transaction_id>"
}
```

- `update_from_datetime` starts the affected range: recalculate from there forward.
- `latest_transaction_id` and `update_from_transaction_id` are **absent when transactions were deleted**. Fall back to the datetime range; code that assumes the IDs exist throws on exactly those events.

## Testing and going live

Taxbit doesn't send test or probe traffic on demand. Ask the implementation manager for a **test subscription** to a non-production endpoint, then:

1. Run the endpoint with signature verification on and `x-trace-id` logged on every request.
2. Trigger a real event of a subscribed type in the test environment.
3. Find the delivery in the logs: received, signature passed, `2xx` returned.
4. Return `500` once and confirm the retry arrives. Confirm no code path, WAF or gateway returns `401` or `403`.
5. Replay a processed delivery and confirm it doesn't double-apply.
6. Give the implementation manager the production endpoint, and confirm the production rate limit and retry settings in writing.

## Troubleshooting

Have `x-trace-id` values and a time range ready for Taxbit Support.

- **No events at all:** usually a deauthorized subscription. Check for any `401`/`403`/`407` from the endpoint or anything in front of it (WAF rule, expired certificate, IP allowlist change), and for changed basic credentials. Then contact Taxbit Support; it won't recover on its own.
- **Signature doesn't verify:** hashing the raw body instead of the re-serialized JSON; hex instead of base64; missing the `v1=` prefix; checking only the first signature during a rotation; a stale secret after a rotation finished.
- **Duplicates:** expected (at-least-once). If unusually many, the endpoint may be acknowledging too slowly.
- **Out of order:** expected. Order by the event's date fields.
- **Too much traffic:** return `429` and ask Taxbit Support to lower the rate limit.

Subscription changes, new event types, secret rotation and replays go to Taxbit Support (enterprisesupport@taxbit.com).

## Known documentation inconsistency

The [Reading curing statuses](https://apidocs.taxbit.com/docs/reading-curing-statuses) guide's sample handler reads `event_type` and `account_owner_id` straight off `req.body`. Deliveries wrap events in `{ timestamp, data: [...] }`, as the Webhooks guide describes, so read them from each entry in `req.body.data`.
