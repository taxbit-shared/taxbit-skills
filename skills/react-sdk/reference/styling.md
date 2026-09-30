<!-- Moved from skills/react-sdk/SKILL.md; regenerate with it (see CLAUDE.md). -->

# CSS / Styling & Customization

The SDK's CSS is **intentionally minimal, hand-written, and mostly unopinionated** — it is a sensible default, not a design system to conform to. **Customers are not expected to keep it.** The real asset is a **predictable, stably-named `taxbit-*` class structure** that is easy to override or replace wholesale. Design the integration around styling those classes yourself, not around the shipped look.

**Two ways to customize (6.0.0+):**

1. **Theme colors with CSS custom properties.** `inline.css` and `basic.css` declare 17 `--taxbit-color-*` properties on `:root`, and every color in them reads from one; `minimal.css` declares only the four status colors. Override them on `:root`, or on any ancestor of the SDK to scope a theme. They take effect only when you import one of those stylesheets. The full list is below; these are the only `--taxbit-*` properties, so don't invent others (no spacing, font, or radius tokens exist).
2. **Override the `taxbit-*` classes** for anything beyond color: layout, spacing, fonts, borders, or a full restyle with no base stylesheet.

Both `TaxbitQuestionnaire` and `TaxbitCuringDocumentation` render the same classes and use the same properties, so one set of overrides styles both. Before 6.0.0 there were no custom properties; on 5.x, customize with class overrides only.

## Choosing a base stylesheet

The base import is optional — many integrators skip it (or use `minimal.css`) and style everything themselves for full control. Import at most one:

| Stylesheet                                | What it provides                                                                                  |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------- |
| _(none)_                                  | No SDK styling. You own every rule against the `taxbit-*` classes. Cleanest slate.                |
| `@taxbit/react-sdk/style/minimal.css`     | Bare bones — only message/badge colors (the four status properties), page width, row and footer spacing, section titles reset to plain text, stacked buttons on narrow screens, and muted disabled buttons. Good starting point when you intend to restyle. |
| `@taxbit/react-sdk/style/inline.css`      | The full default look — layout, inputs, buttons, badges. Use if the default is close enough and you only tweak.               |
| `@taxbit/react-sdk/style/basic.css`       | Nearly identical to `inline.css`; `.taxbit-row` uses column layout, radio sub-options are styled differently, and it adds a placeholder color and a postal-code margin. |
| `@taxbit/react-sdk/style/index.css`       | Root defaults only: Inter font stack, base text color `#12263f`, and page padding. Pairs with the others. |

```tsx
import '@taxbit/react-sdk/style/inline.css'; // optional base
import './taxbit-overrides.css';             // your CSS, imported AFTER the base
```

## Color properties (6.0.0+)

Declared on `:root` by `inline.css` and `basic.css` (defaults meet WCAG 2.1 AA contrast on white). `minimal.css` declares only the four status colors.

| Property | Default | Used for |
| --- | --- | --- |
| `--taxbit-color-text` | `#12263f` | Body text and titles |
| `--taxbit-color-text-muted` | `#5c6773` | Sub-labels, helper text |
| `--taxbit-color-placeholder` | `#767676` | Placeholder text |
| `--taxbit-color-on-primary` | `#ffffff` | Text on primary buttons |
| `--taxbit-color-error` | `#b22222` | Errors, invalid badges |
| `--taxbit-color-warning` | `#a06000` | Warnings, pending badges |
| `--taxbit-color-success` | `#008000` | Success, valid badges |
| `--taxbit-color-info` | `#0000ff` | Info messages |
| `--taxbit-color-border` | `#7d899e` | Input and select borders |
| `--taxbit-color-divider` | `#e4ebf6` | Dividers, footer rule |
| `--taxbit-color-primary` | `#0060df` | Primary (Next, Submit) button |
| `--taxbit-color-primary-hover` | `#0250bb` | Primary button hover |
| `--taxbit-color-primary-disabled` | `#aab3bb` | Disabled primary button |
| `--taxbit-color-secondary-bg` | `#f9f9f9` | Secondary (Back) button |
| `--taxbit-color-secondary-bg-hover` | `#e9e9e9` | Secondary button hover |
| `--taxbit-color-secondary-text` | `#1a1a1a` | Secondary button text |
| `--taxbit-color-secondary-text-hover` | `#000000` | Secondary button hover text |

```css
/* Brand colors, with inline.css or basic.css imported */
:root {
  --taxbit-color-primary: #6b21a8;
  --taxbit-color-primary-hover: #581c87;
  --taxbit-color-text: #1f2937;
}
```

## Other defaults (only relevant if you keep a base and tweak piecemeal)

- **Layout:** page `max-width: 600px`; inputs and selects `height: 33px`; border radius 4px (inputs), 8px (buttons); below 600px the step buttons stack full width.
- **Font:** `index.css` sets `Inter, system-ui, Avenir, Helvetica, Arial, sans-serif` and the base text color `#12263f`; the other stylesheets inherit the host's font.
- **Section titles** render as `<h4>` (6.0.0+); `minimal.css` resets their margin, size, and weight so they match the surrounding text, and the other stylesheets style them. Embed the SDK where an `h4` fits your page's heading outline.

## Class reference

Every class uses the `taxbit-` prefix and follows the DOM nesting below (outermost → innermost). Override any of them. Not all are styled by the bundled stylesheets — many are structural wrappers exposed purely as override hooks, so a class appearing here that has no rule in `basic.css`/`inline.css` is still a valid, stable target. The reverse also happens: the bundled CSS has rules for `.taxbit-textarea`, `.taxbit-progress-status`, and `.taxbit-input-status-footer`, but the SDK never renders those classes (checked in 6.0.0), so don't target them.

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
| `.taxbit-page-actions` / `.taxbit-step-actions`    | Footer action-bar wrapper                                  |
| `.taxbit-primary-actions`                          | Next / Submit group (`--taxbit-color-primary`)             |
| `.taxbit-secondary-actions`                        | Back / Cancel group                                        |

> **Button order (6.0.0+):** the primary group comes **first in the DOM**, before Back, so keyboard and screen-reader users reach it first. The bundled stylesheets use `flex-direction: row-reverse` on the action bar to keep Back on the left on wide screens, and stack the buttons (primary on top) below 600px. If your own stylesheet lays the action bar out as a row, add `flex-direction: row-reverse` or Next will appear on the left.

**Sections (grouping within a step)**

| Class                                 | Element / role                                                    |
| ------------------------------------- | ----------------------------------------------------------------- |
| `.taxbit-form-<form-name>`            | Dynamic wrapper keyed by form type (e.g. `.taxbit-form-w-8ben-e`) — theme one form. See Dynamic classes below. |
| `.taxbit-section`                     | A titled group of fields                                          |
| `.taxbit-section-header`              | Section header                                                    |
| `.taxbit-section-header-title`        | Section title (an `<h4>` in 6.0.0+)                               |
| `.taxbit-section-header-title-group`  | Wraps the title and subtitle (6.0.0+)                             |
| `.taxbit-section-header-sub-title`    | Section subtitle                                                  |
| `.taxbit-section-header-action`       | Right-aligned action slot in a section header                     |
| `.taxbit-section-content`             | Section body                                                      |
| `.taxbit-form-text`                   | Free-standing explanatory paragraph block                        |

**Field rows**

| Class                                                        | Element / role                                                    |
| ------------------------------------------------------------ | ----------------------------------------------------------------- |
| `.taxbit-question-<field-name>`                              | Dynamic per-field wrapper (e.g. `.taxbit-question-tin`) — target one field. See Dynamic classes below. |
| `.taxbit-row`                                                | One field row (label + value); gets `.taxbit-error` when invalid  |
| `.taxbit-label`                                              | Field label. For grouped controls (radio sets, phone and date rows, tax-residency and controlling-person sections) it's a `<div>` that labels the group, not a `<label>` (6.0.0+) |
| `.taxbit-required-marker`                                    | Required indicator (6.0.0+): a `<span aria-hidden="true">` containing the asterisk, beside the label (previously the asterisk was part of the label text). Unstyled by the bundled CSS; style the span to change it |
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

The bundled stylesheets style address subfields `.taxbit-city`, `.taxbit-state`, and `.taxbit-postal-code`. Inspect the rendered markup for the exact subfield classes in your flow rather than coding against a fixed list. `.taxbit-address-line-1`, `.taxbit-address-line-2`, `.taxbit-address-region`, and `.taxbit-address-country` **don't exist** in the 6.0.0 source or any shipped bundle; don't target them.

**Buttons**

| Class                        | Element / role                                                          |
| ---------------------------- | ----------------------------------------------------------------------- |
| `.taxbit-button`             | Base button (used inside primary/secondary action groups; rendered as `button.taxbit-button` — see specificity note) |
| `.taxbit-button-disabled`    | Disabled modifier. In 6.0.0+ the primary action (Next, Submit) is never natively `disabled`: while it works or after submit it carries `aria-disabled="true"` plus this class and ignores clicks, so focus stays on it. Other unavailable buttons keep the native `disabled` attribute. Mute disabled buttons with `.taxbit-button-disabled` or `[aria-disabled='true']`, not only `:disabled` |

**Status, messages & badges**

| Class                                | Element / role                                                        |
| ------------------------------------ | --------------------------------------------------------------------- |
| `.taxbit-badge`                      | Validation badge; state modifiers `.valid` / `.invalid` / `.pending`  |
| `.taxbit-error-message`              | Error text (`--taxbit-color-error`, `0.8em`); a live region announced to screen readers |
| `.taxbit-success-message`            | Success text (`--taxbit-color-success`, `0.8em`)                      |
| `.taxbit-info-message`               | Info text (`--taxbit-color-info`, `0.8em`)                            |
| `.taxbit-warning-message`            | Warning text (`--taxbit-color-warning`, `0.8em`)                      |
| `.taxbit-spinner-icon`               | Loading spinner                                                       |

**State modifiers (applied alongside the classes above)**

| Class              | Element / role                                                      |
| ------------------ | ------------------------------------------------------------------- |
| `.taxbit-error`    | On a `.taxbit-row` to flag validation errors                        |
| `.taxbit-disabled` | Dimmed/disabled state (rows; checkboxes via `.disabled`)            |

## Dynamic classes

Two class families are generated at runtime by **kebab-casing the form or field key**. Don't hard-code a fixed list; derive the name from the key:

- `.taxbit-form-<form-name>`: one per form type, e.g. W-8BEN-E → `.taxbit-form-w-8ben-e`. Use it to theme a single form type.
- `.taxbit-question-<field-name>`: one per field row, e.g. the TIN field → `.taxbit-question-tin`. Use it to target a single field.

**Per-field error text:** there is no per-field error class. Scope the shared class by field row, e.g. `.taxbit-question-tin .taxbit-error-message`.

**`taxbit-error-message-<field>` and `taxbit-group-label-<key>` are element `id`s, not classes.** They exist for `aria-describedby` and `aria-labelledby` (the same goes for other `taxbit-error-*` ids such as `taxbit-error-dob`). Don't write CSS against them as classes. Earlier versions of this skill documented `.taxbit-error-message-<field-name>` as a class; it never was one.

## Specificity note (when keeping a base stylesheet)

If you import no base, ignore this — your rules are the only rules. When you keep a base, first check whether a color property covers what you want; it avoids specificity entirely. For class overrides: buttons are styled with element-qualified selectors (`button.taxbit-button`, `button.taxbit-button-disabled`, `button.taxbit-button[aria-disabled='true']`) and primary/secondary buttons via **nested** child selectors (e.g. `.taxbit-step-actions .taxbit-primary-actions > button`). A bare `.taxbit-button { … }` override may lose to these. To reliably win, match or exceed their specificity (qualify with `button`, replicate the nesting, or scope under a container) rather than reaching for `!important`.

## Override examples

```css
/* taxbit-overrides.css — imported after the base stylesheet */

/* Brand the primary button: on 6.0.0+ prefer the color properties */
:root {
  --taxbit-color-primary: #6b21a8;
  --taxbit-color-primary-hover: #581c87;
}

/* ...or the class override (all versions) */
.taxbit-step-actions .taxbit-primary-actions > button {
  background-color: #6b21a8;
}

/* Restyle inputs and selects */
.taxbit-input,
.taxbit-select {
  border: 1px solid #d1d5db;
  border-radius: 6px;
}

/* Color the required asterisk (6.0.0+) */
.taxbit-required-marker { color: var(--taxbit-color-error); }

/* Widen the form and change the title */
.taxbit-page { max-width: 820px; }
.taxbit-page-title { color: #6b21a8; font-size: 1.4em; }
```
