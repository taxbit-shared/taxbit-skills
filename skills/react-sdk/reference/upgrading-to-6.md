<!-- Regenerate from the @taxbit/react-sdk 6.0.0 package (CHANGELOG.md, style/*.css, dist/) with SKILL.md (see CLAUDE.md). -->

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
