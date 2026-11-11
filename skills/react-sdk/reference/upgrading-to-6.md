# Upgrading to 6.0.0

6.0.0 (2026-09-29) brings WCAG 2.1 AA conformance throughout the questionnaire, on-demand language loading, and server-rendering support. **Props, exports, and `useTaxbit`'s return shape are unchanged.** What breaks is styling, DOM-based tests, and hand-copied builds.

## Breaking changes

**Stylesheets** (details in [styling.md](styling.md))

- `inline.css` and `basic.css` declare their colors as 17 `--taxbit-color-*` custom properties on `:root`; `minimal.css` declares the four status colors. Several defaults changed to meet AA contrast (muted text, placeholder, borders, warning, the primary button palette). Class overrides you already have still win on specificity; you can now theme by overriding the properties instead.
- The primary action (Next, Submit) now comes **before** Back in the DOM. The bundled CSS keeps Back on the left with `flex-direction: row-reverse` and stacks the buttons, primary on top, below 600px. A host stylesheet that lays the action bar out as a row shows Next on the left unless it reverses the row too.
- The required indicator is a decorative `<span class="taxbit-required-marker" aria-hidden="true">` holding the asterisk, beside the label, instead of an asterisk in the label text. It renders as before unless you style it.
- Section titles are `<h4>` elements, and labels for grouped controls are `<div class="taxbit-label">` rather than `<label>`.
- The primary action is no longer natively `disabled` while it works or after submit. It carries `aria-disabled="true"` and `taxbit-button-disabled`, and ignores clicks. A host stylesheet that muted only `:disabled` must also target the class or the attribute.

**DOM and test selectors**

- Form controls no longer have an `aria-label` equal to their field key. Accessible names come from the visible label (`<label htmlFor>` or `aria-labelledby`). Select controls by visible text or by `id`; ids are unchanged.
- A control's accessible name is the label text without the asterisk: match `Label`, not `Label*`. Required state is `aria-required`.
- Radio sets are `role="radiogroup"`. Phone and date rows and the tax-residency and controlling-person sections are `role="group"`, labelled via `aria-labelledby`.
- Tests that pick the step buttons by position must swap Next and Back.
- Selects with a placeholder (every date part, including date of birth and the FATCA dates, and the phone country code) open with a disabled placeholder option instead of a blank option, so tests that pick the first option by position must skip it.
- The primary action carries `aria-busy="true"` only while a real-time TIN or GIIN check runs.

**Package layout**

- The ES build (`dist/taxbit-react-sdk.js`) now loads each language from its own file in `dist/`, fetched the first time it's shown. Bundlers handle this automatically. If you copy the entry file by hand, copy the language files with it. The UMD build (`require`, `<script>`) is still a single file.

**Host page responsibilities**

- Some WCAG criteria need the host page: a per-view `<title>`, `<html lang>`, and a heading outline where the SDK's `<h4>` section titles fit. The package ships `ACCESSIBILITY.md` listing what the SDK handles and what the host must provide.

## Also new (non-breaking)

- Screen-reader support: validation and status messages are live regions, composite fields (phone, date) name each sub-control, autofill is offered on the account holder's fields, and language options carry `lang`.
- On each step change, focus moves to the new step's title, so the page scrolls back up to it on Next. The first step never takes focus from the host page.
- **Server rendering (Next.js):** the questionnaire renders its `loadingComponent`, or nothing, on the server, so hydration doesn't mismatch. To skip the server render entirely: `dynamic(() => import('@taxbit/react-sdk').then((m) => m.TaxbitQuestionnaire), { ssr: false })`.
- Only the displayed language is downloaded. Switching languages keeps the current one on screen until the new one arrives, and falls back to it if the fetch fails. `loadingComponent` also shows while the first language downloads.
- Submitted documents include the certification statements and the no-other-tax-residencies confirmations as optional booleans. The certifications are affirmed by default.
- Every locale carries every string; no more partial English fallback.
- A previously submitted self-certification or digital platform seller record now loads back into the form.

## Later 6.x releases

None of these break anything; upgrade from any 6.x release without changes. If you read submissions in `onSubmit`, see the 6.3.0 notes.

**6.3.0 (2026-10-13)**

- **E-delivery consent.** Pass `eDeliveryConsent` to add a checkbox to the Review and Sign section of the W-9 and W-8 summaries, asking the recipient to consent to receiving tax forms electronically. It starts checked, is never required, and isn't pre-filled from a previous submission. The submission carries `hasEDeliveryConsent` (`true` or `false`; absent when the prop is off), and its `config` records `eDeliveryConsent`.
- **Phone numbers in E.164.** `accountHolder.phoneNumber` is submitted as `+`, dial code and number with no spaces (`+447872615090`). If your code expects digits only, strip the leading `+`. A country chosen with no number submits no phone, and a saved phone isn't submitted when the phone question is hidden.
- **Failed submissions keep the answers.** The questionnaire stays on screen with "Your Tax Documentation could not be saved. Please try again." above Submit, in the user's language, and the user can submit again. `onError` still receives the server's error, and `onSubmit` still fires before the answers are sent.
- **`taxbit-required` class** on every required question's row (`div.taxbit-row.taxbit-required`), exactly when it shows `.taxbit-required-marker`, including on the summary.
- **Physical address warning on W-8s.** A Permanent Residence Address that looks like a PO Box or care-of address shows "Must be a physical address (not a P.O. Box or c/o)." on the address step and the summary. It doesn't block submission. Kuwait and Saudi Arabia are exempt.

**6.2.0 (2026-10-06)**

- **Usage telemetry, on by default.** `TaxbitQuestionnaire` posts usage events to `telemetry/events`: the questionnaire loading, each step shown, Next / Back / Edit / Submit presses, the validation errors a press revealed, real-time TIN and GIIN outcomes, and submission, along with the configuration props in effect. Events carry step ids, field keys, coded validation keys (for example `required`) and check status codes, never what the user typed. They go to the same environment, region or `proxyDomain` as the other requests, with the same bearer token. A failed event never blocks or interrupts the questionnaire.
  - To opt out, pass `telemetry={false}`; no telemetry requests are made. Nothing is sent without a `bearerToken` either, as in `demoMode`.
  - If your proxy forwards only listed paths, add `telemetry/events`. Without it the events fail quietly.
  - A CSP that already allows the SDK's API host needs nothing new.
- **VIES failures no longer block DPS submission.** A VAT number that failed its VIES check shows an "Invalid" badge beside the VAT label on the tax information step and on the summary, and the user can resubmit without changing it.
- **Brazil entity TIN (CNPJ)** accepts the alphanumeric CNPJ: 12 letters or digits followed by 2 check digits, entered as 14 characters or formatted as `XX.XXX.XXX/XXXX-NN`. Before, only the formatted all-digit CNPJ was accepted.

**6.1.0 (2026-10-01)**

- The country and phone-country pickers include 22 more jurisdictions (for example `FQ`, `BURMA`, `XK`) with localized names.
