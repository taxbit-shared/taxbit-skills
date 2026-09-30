<!-- Moved from skills/react-sdk/SKILL.md; regenerate with it (see CLAUDE.md). -->

# CSS / Styling & Customization

The SDK's CSS is **intentionally minimal, hand-written, and mostly unopinionated** — it is a sensible default, not a design system to conform to. **Customers are not expected to keep it.** The real asset is a **predictable, stably-named `taxbit-*` class structure** that is easy to override or replace wholesale. Design the integration around styling those classes yourself, not around the shipped look.

**There are no CSS custom properties / theming variables** — the defaults are plain hardcoded values inside `taxbit-*` classes, so do not invent `--taxbit-*` variables; they do not exist. All customization is done by targeting the `taxbit-*` classes with your own CSS. Both `TaxbitQuestionnaire` and `TaxbitCuringDocumentation` render the same classes, so one set of overrides styles both.

## Choosing a base stylesheet

The base import is optional — many integrators skip it (or use `minimal.css`) and style everything themselves for full control. Import at most one:

| Stylesheet                                | What it provides                                                                                  |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------- |
| _(none)_                                  | No SDK styling. You own every rule against the `taxbit-*` classes. Cleanest slate.                |
| `@taxbit/react-sdk/style/minimal.css`     | Bare bones — only message/badge colors, page width, and a few structural rules. Good starting point when you intend to restyle. |
| `@taxbit/react-sdk/style/inline.css`      | The full default look — layout, inputs, buttons, badges. Use if the default is close enough and you only tweak.               |
| `@taxbit/react-sdk/style/basic.css`       | Nearly identical to `inline.css`; differs only in radio sub-option styling, `.taxbit-row` uses column layout, and a postal-code margin. |
| `@taxbit/react-sdk/style/index.css`       | Root defaults only: Inter font stack, base text color `#12263f`, and page padding. Pairs with the others. |

```tsx
import '@taxbit/react-sdk/style/inline.css'; // optional base
import './taxbit-overrides.css';             // your CSS, imported AFTER the base
```

## Default values (only relevant if you keep a base and tweak piecemeal)

These are the hardcoded defaults — a reference for what you're overriding when you extend the shipped look rather than replace it. If you're styling from scratch, ignore them.

- **Primary (submit) button:** background `rgb(0, 96, 223)`, hover `rgb(2, 80, 187)`, disabled `rgb(170, 179, 187)`, text `#ffffff`
- **Secondary button:** background `#f9f9f9`, hover `#e9e9e9`, text `#1a1a1a`
- **Body text / titles:** `#12263f`
- **Borders / dividers:** `#e4ebf6`; **input border:** `#bfcde2`
- **Status colors:** valid/success `green`, invalid/error `firebrick`, warning/pending `goldenrod`, info `blue`
- **Layout:** page `max-width: 600px`, inputs/selects `height: 33px`, border-radius 4px (inputs) / 8px (buttons)
- **Font:** `Inter, system-ui, Avenir, Helvetica, Arial, sans-serif`

## Class reference

Every class uses the `taxbit-` prefix and follows the DOM nesting below (outermost → innermost). Override any of them. Not all are styled by the bundled stylesheets — many are structural wrappers exposed purely as override hooks, so a class appearing here that has no rule in `basic.css`/`inline.css` is still a valid, stable target.

**Root & page chrome**

| Class                                              | Element / role                                             |
| -------------------------------------------------- | ---------------------------------------------------------- |
| `.taxbit-page`                                     | Outermost questionnaire container (width, padding)         |
| `.taxbit-page-header`                              | Top header bar                                             |
| `.taxbit-page-title`                               | Step/page heading                                          |
| `.taxbit-page-sub-title`                           | Subtitle under the title                                   |
| `.taxbit-select-language`                          | Language picker dropdown in the header                     |
| `.taxbit-page-main` / `.taxbit-page-content`       | Main body wrapper / inner content region                   |
| `.taxbit-page-footer` / `.taxbit-footer`           | Footer region (top border, spacing)                        |
| `.taxbit-page-actions` / `.taxbit-step-actions`    | Footer action-bar wrapper (space-between)                  |
| `.taxbit-primary-actions`                          | Right-aligned group (Next/Submit) — default `rgb(0,96,223)` |
| `.taxbit-secondary-actions`                        | Left-aligned group (Back/Cancel)                           |

**Sections (grouping within a step)**

| Class                                 | Element / role                                                    |
| ------------------------------------- | ----------------------------------------------------------------- |
| `.taxbit-form-<form-name>`            | Dynamic wrapper keyed by form type (e.g. `.taxbit-form-w-8ben-e`) — theme one form. See Dynamic classes below. |
| `.taxbit-section`                     | A titled group of fields                                          |
| `.taxbit-section-header`              | Section header                                                    |
| `.taxbit-section-header-title`        | Section title                                                     |
| `.taxbit-section-header-sub-title`    | Section subtitle                                                  |
| `.taxbit-section-header-action`       | Right-aligned action slot in a section header                     |
| `.taxbit-section-content`             | Section body                                                      |
| `.taxbit-form-text`                   | Free-standing explanatory paragraph block                        |

**Field rows**

| Class                                                        | Element / role                                                    |
| ------------------------------------------------------------ | ----------------------------------------------------------------- |
| `.taxbit-question-<field-name>`                              | Dynamic per-field wrapper (e.g. `.taxbit-question-tin`) — target one field. See Dynamic classes below. |
| `.taxbit-row`                                                | One field row (label + value); gets `.taxbit-error` when invalid  |
| `.taxbit-label`                                              | Field label                                                       |
| `.taxbit-sub-label`                                          | Helper/description text under the label (styles nested `p`/`ol`/`ul`) |
| `.taxbit-row-content` / `.taxbit-row-value` / `.taxbit-input-group` | Value-side containers (input + adornments)                 |
| `.taxbit-row-actions`                                        | Right-side action column for the row                              |
| `.taxbit-row-action-button`                                  | Generic small row button                                          |
| `.taxbit-row-edit-button` / `.taxbit-row-edit-button-content` | Edit button and its inner content                                 |
| `.taxbit-show-button` / `.taxbit-hide-button`                | Password-style show/hide toggles                                  |
| `.taxbit-input-status`                                       | Input-status wrapper                                              |

**Form controls**

| Class                                                          | Element / role                                      |
| -------------------------------------------------------------- | --------------------------------------------------- |
| `.taxbit-input`                                                | Text input base                                     |
| `.taxbit-input-file`                                           | File input                                          |
| `.taxbit-password`                                             | Password field                                      |
| `.taxbit-select`                                               | Dropdown base                                       |
| `.taxbit-country-code-select`                                  | Country dropdown (width-constrained)                |
| `.taxbit-select-day` / `.taxbit-select-month` / `.taxbit-select-year` | Date-part selects                            |
| `.taxbit-select-language`                                      | Language select (also listed under header)          |
| `.taxbit-checkbox` / `.taxbit-checkbox-label`                  | Checkbox + its label; `.disabled` modifier          |
| `.taxbit-radio-buttons`                                        | Radio group container                               |
| `.taxbit-radio-button`                                         | One radio row                                       |
| `.taxbit-radio-button-option`                                  | Option label wrapper                                |
| `.taxbit-radio-button-sub-option`                              | Option helper text                                  |
| `.taxbit-placeholder`                                          | Placeholder/empty-value styling                     |
| `.taxbit-file-selected` / `.taxbit-file-icon` / `.taxbit-file-value`   | Selected-file display                       |

**Address composite**

Address subfields do **not** have a fixed class list. They are generated at runtime from the field key as `` `taxbit-${key}` ``, which is why you will see classes like `.taxbit-city` and `.taxbit-postal-code` in the DOM. Inspect the rendered markup for the exact keys in your flow rather than coding against a list.

> `.taxbit-address-line-1`, `.taxbit-address-line-2`, `.taxbit-address-region`, and `.taxbit-address-country` are **declared in the SDK source but unused**, so the bundler drops them and they appear in no shipped bundle through 5.0.0. Do not target them today. They would become real if that component is ever wired in.

**Buttons**

| Class                        | Element / role                                                          |
| ---------------------------- | ----------------------------------------------------------------------- |
| `.taxbit-button`             | Base button (used inside primary/secondary action groups; rendered as `button.taxbit-button` — see specificity note) |
| `.taxbit-button-disabled`    | Disabled modifier                                                       |

**Status, messages & badges**

| Class                                | Element / role                                                        |
| ------------------------------------ | --------------------------------------------------------------------- |
| `.taxbit-badge`                      | Validation badge; state modifiers `.valid` / `.invalid` / `.pending`  |
| `.taxbit-error-message`              | Error text (`firebrick`, `0.8em`)                                     |
| `.taxbit-success-message`            | Success text (`green`, `0.8em`)                                       |
| `.taxbit-info-message`               | Info text (`blue`, `0.8em`)                                           |
| `.taxbit-warning-message`            | Warning text (`goldenrod`, `0.8em`)                                   |
| `.taxbit-error-message-<field-name>` | Dynamic per-field error message (e.g. `.taxbit-error-message-tin`). See Dynamic classes below. |
| `.taxbit-spinner-icon`               | Loading spinner                                                       |

**State modifiers (applied alongside the classes above)**

| Class              | Element / role                                                      |
| ------------------ | ------------------------------------------------------------------- |
| `.taxbit-error`    | On a `.taxbit-row` to flag validation errors                        |
| `.taxbit-disabled` | Dimmed/disabled state (rows; checkboxes via `.disabled`)            |

## Dynamic classes

Three class families are generated at runtime by **kebab-casing the form or field key** — do not hard-code a fixed list, derive the name from the key:

- `.taxbit-form-<form-name>` — one per form type, e.g. W-8BEN-E → `.taxbit-form-w-8ben-e`. Use to theme a single form type.
- `.taxbit-question-<field-name>` — one per field, e.g. the TIN field → `.taxbit-question-tin`. Use to target a single field's row.
- `.taxbit-error-message-<field-name>` — the error text for a specific field, e.g. `.taxbit-error-message-tin`.

**Caveat — not everything `taxbit-error-*` is a class.** Some `taxbit-error-*` tokens in the DOM (e.g. `taxbit-error-dob`, `taxbit-error-tin-not-required`) are element **`id`s** used for `aria-describedby`, not CSS classes. Do not write CSS overrides against them; target the `.taxbit-error-message-<field-name>` **class** for per-field error styling instead.

## Specificity note (when keeping a base stylesheet)

If you import no base, ignore this — your rules are the only rules. When you keep a base and override it: buttons are styled with element-qualified selectors (`button.taxbit-button`, `button.taxbit-button-disabled`) and primary/secondary buttons via **nested** child selectors (e.g. `.taxbit-step-actions .taxbit-primary-actions > button`). A bare `.taxbit-button { … }` override may lose to these. To reliably win, match or exceed their specificity (qualify with `button`, replicate the nesting, or scope under a container) rather than reaching for `!important`.

## Override examples

```css
/* taxbit-overrides.css — imported after the base stylesheet */

/* Brand the primary submit/next button */
.taxbit-step-actions .taxbit-primary-actions > button {
  background-color: #6b21a8;
}
.taxbit-step-actions .taxbit-primary-actions > button:hover {
  background-color: #581c87;
  border-color: #581c87;
}

/* Restyle inputs and selects */
.taxbit-input,
.taxbit-select {
  border: 1px solid #d1d5db;
  border-radius: 6px;
}

/* Widen the form and change the title */
.taxbit-page { max-width: 820px; }
.taxbit-page-title { color: #6b21a8; font-size: 1.4em; }
```
