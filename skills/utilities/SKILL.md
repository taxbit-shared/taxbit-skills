---
name: utilities
description: Helps developers use the @taxbit/utilities package — framework-agnostic lookups (dropdown option lists), format validators, error-message helpers, tax-documentation type guards, TypeScript types, and camel/snake case converters for building custom tax-documentation UIs or validating tax-doc data. Use when writing code that imports @taxbit/utilities, needs valid enum/option values, validates TINs/GIINs/VAT IDs/addresses, or works with ClientTaxDocumentation data. For the questionnaire widgets, use the react-sdk skill; for the REST API, use the api skill.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - Write
  - Edit
  - WebFetch
---

You are a Taxbit utilities integration assistant. Help developers use `@taxbit/utilities` — the shared, framework-agnostic toolkit behind the Taxbit React SDK.

## Package Info

- **NPM:** `@taxbit/utilities`
- **Latest version:** `7.1.0`
- **Install:** `npm i @taxbit/utilities`
- **Runtime dependencies:** none. **Framework-agnostic** (no React) — usable in Node, browsers, or any TS/JS project. TypeScript definitions are bundled.

## What It Does

`@taxbit/utilities` is the data/validation layer that the `@taxbit/react-sdk` questionnaire is built on. Use it directly when you need to:
- Populate your own form dropdowns with the exact option values Taxbit expects (**lookups**)
- Validate TINs, GIINs, VAT IDs, phone numbers, emails, addresses, and dates (**validators**)
- Produce field-level error messages (**error-message helpers**)
- Narrow, assert, and type tax-documentation data in TypeScript (**type guards & types**)
- Convert object keys between `camelCase` (SDK/client shape) and `snake_case` (REST API shape)

The React SDK re-exports several of these types (`ClientTaxDocumentation`, `ClientTaxResidency`), so importing from `@taxbit/utilities` keeps you aligned with the SDK's data model.

```ts
import {
  exemptPayeeCodes,
  isValidUsTin,
  getUsTinErrorMessages,
  isWFormAccountHolderUsIndividualTaxDocumentation,
  camelCaseKeys,
  snakeCaseKeys,
  type ClientTaxDocumentation,
} from '@taxbit/utilities';
```

> Note: this package exports ~400 members. This skill documents the categories and the most-used members; when you need a member not listed here, inspect the bundled `.d.ts` (`node_modules/@taxbit/utilities/dist/index.d.ts`) or fetch the docs. **Prefer importing a lookup/validator over hardcoding option values or regexes** — they track IRS/OECD rules and stay in sync with the API.

## Lookups (dropdown / enum option lists)

Each lookup is a `readonly` tuple plus a derived union type (e.g. `accountOwnerTypes` and `AccountOwnerType`). Use these to build `<select>` options and to constrain your own types.

| Lookup                              | Values / notes                                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------------------------------ |
| `accountOwnerTypes`                 | `INDIVIDUAL`, `ENTITY`, `INTERMEDIARY`                                                            |
| `exemptPayeeCodes`                  | `"1"`–`"13"` (W-9 exempt payee codes)                                                             |
| `exemptFatcaCodes`                  | `"A"`–`"M"` (W-9 FATCA exemption codes)                                                           |
| `signatureCapacities`               | `OFFICER`, `EXECUTOR`, `OTHER_CAPACITY`                                                           |
| `limitationOnBenefits`              | `GOVERNMENT`, `TAX_EXEMPT_PENSION`, `OTHER_TAX_EXEMPT_ORGANIZATION`, `PUBLICLY_TRADED_CORPORATION`, `SUBSIDIARY`, `COMPANY_MEETS_EROSION_TEST`, `COMPANY_MEETS_DERIVATIVE_TEST`, `COMPANY_MEETS_BUSINESS_TEST`, `FAVORABLE_DETERMINATION`, `NO_LOB_ARTICLE`, `OTHER_ARTICLE_PARAGRAPH` |
| `entityTypes`                       | `TRUST`, `SIMILAR_TO_TRUST`, `OTHER`                                                              |
| `tinNotRequiredReasons`             | `NOT_ISSUED`, `OTHER`, `NOT_REQUIRED`                                                             |
| `countryCodes` / `getCountry(code)` | Full ISO 3166-1 alpha-2 list; `getCountry` returns `{ code, mt, phoneCode?, flag, tinAcronym? }` |
| `activeNonFinancialEntityTypes`, `financialInstitutionTypes`, `selfCertificationAccountTypes` | Self-certification classifications                       |
| `usAccountHolderAccountTypes`, `foreignAccountHolderAccountTypes`, `entityAccountHolderAccountTypes`, `usRegardedOwnerAccountTypes`, `foreignRegardedOwnerAccountTypes`, `entityRegardedOwnerAccountTypes`, `usLlcAccountTypes`, `intermediaryAccountTypes` | W-Form account-type option sets by holder/owner kind |
| `usStateOptions`, `caProvinceOptions`, `auStateOptions`, `monthOptions` | Region/date option lists with labels (see `get*Options`/`get*Label` helpers) |

**Controlling-person roles** vary by entity type — use the helper rather than a fixed list:
```ts
import { getControllingPersonRoles } from '@taxbit/utilities';
getControllingPersonRoles('TRUST');           // SETTLOR, TRUSTEE, PROTECTOR, BENEFICIARY, OTHER
getControllingPersonRoles('SIMILAR_TO_TRUST'); // *_EQUIVALENT variants
getControllingPersonRoles('OTHER');            // OWNER, OTHER_MEANS, SENIOR_MANAGING_OFFICIAL
```
(Underlying tuples: `trustRoles`, `similarToTrustRoles`, `otherEntityRoles`; union type `ControllingPersonRole`.)

Label/option helpers: `getCountryOptions`, `getCountryLabel`, `getUsStateOptions`, `getUsStateLabel`, `getCaProvinceOptions`, `getCaProvinceLabel`, `getAuStateOptions`, `getAuStateLabel`, `getMonthOptions`, `getMonthLabel`, `getCountryWithPhoneOptions`.

## Format Validators

Boolean checks and TypeScript type guards for individual field values.

| Function                     | Purpose                                                                    |
| ---------------------------- | -------------------------------------------------------------------------- |
| `isValidUsTin(value)`        | US TIN (SSN/EIN) format + disallowed-pattern checks                        |
| `isTinOk(value, countryCode, isIndividual)` | Country-aware TIN validity                                  |
| `isCorrectGiinFormat(value)` | GIIN format `XXXXXX.XXXXX.XX.XXX` (no letter "O")                           |
| `isValidVatin(value)` / `isVatinOk(value, countryCode)` / `isCorrectVatinFormat(value)` | VAT ID validity          |
| `isValidGbTin(value)` / `isValidNinoFormat(value)` | UK TIN / NINO format                                 |
| `isValidAuTin(value)` / `isValidABNFormat(value)` | Australian TIN / ABN format                           |
| `isValidEmailAddress(value)` | Email address format                                                       |
| `isValidPhoneNumber(value)`  | Phone number format                                                        |
| `isValidUsPostalCodeFormat`, `isValidCaPostalCodeFormat`, `isValidAuPostalCodeFormat`, `isCorrectCaPostalCodeShape` | Postal codes |
| `isValidUsState`, `isValidCaProvince`, `isValidAuState` | State/province membership                              |
| `isCountryCode(value)` / `isEuCountryCode(value)` / `isHighRiskCountry(value)` | Country-code guards                     |
| `isValidDateString`, `isValidDateFormat`, `isDateIsoString`, `isAboveMinimumAge`, `isValidAge` | Dates / age               |

Low-level helpers also exported: `isBlank`, `isPresent`, `isString`, `isBoolean`, `containsTitle`, `containsNumericCharacters`, `startsWithFiveZeros`, `isStringRepeatingCharacter`, `isDisallowedTaxId`.

## Error-Message Helpers

Each `get<Field>ErrorMessages(value)` returns `ErrorMessage[] | undefined` (`undefined` = valid). Use them to drive inline form validation.

```ts
import { getUsTinErrorMessages, errorMessages } from '@taxbit/utilities';
const errs = getUsTinErrorMessages(inputValue); // e.g. ['mustBeNineDigits'] | ['invalid'] | undefined
```

Available: `getUsTinErrorMessages`, `getGbTinNinoErrorMessages`, `getAuTinErrorMessages`, `getGiinErrorMessages`, `getVatIdentificationNumberErrorMessages`, `getBusinessRegistrationNumberErrorMessages`, `getEmailAddressErrorMessages`, `getPhoneNumberErrorMessages`, `getNameErrorMessages`, `getSignatureErrorMessages`, `getDateOfBirthErrorMessages`, `getWFormDateOfBirthErrorMessages`, `getCountryErrorMessages`, `getTaxResidencesErrorMessages`, `getTaxResidenceTinErrorMessages`, `getUsStateOrProvinceErrorMessages`, `getCaStateOrProvinceErrorMessages`, `getAuStateOrProvinceErrorMessages`, `getUsPostalCodeErrorMessages`, `getCaPostalCodeErrorMessages`, `getAuAddressLineErrorMessages`, `getAuCityErrorMessages`, `getAuPostalCodeErrorMessages`, `getSpecialNumberErrorMessages`, `getSpecialStringErrorMessages`.

`errorMessages` is the canonical code map (`Required: 'required'`, `Invalid: 'invalid'`, `MustBeNineDigits: 'mustBeNineDigits'`, `MustBeABNFormat`, `MustBeInVatinFormat`, `TooShort`, `TooLong`, …); the `ErrorMessage` type is the union of its values. Map these codes to your own localized copy.

## Tax-Documentation Type Guards & Types

Runtime type guards (`is<Shape>TaxDocumentation(doc)`) narrow a `ClientTaxDocumentation` to a specific case — e.g. `isWFormAccountHolderUsIndividualTaxDocumentation`, `isWFormForeignIntermediaryTaxDocumentation`, `isDpsTaxDocumentation`, `isSelfCertificationFiTaxDocumentation`. Assertion helpers (`assertVerifiedClientTaxDocumentation`, `assertVerifiedComprehensiveTaxDocumentation`) throw a `ValidationError` (carrying `issues: ValidationIssue[]`) if the document isn't complete/valid.

Key exported types: `ClientTaxDocumentation` (+ `ClientAccountHolderTaxDocumentation`, `ClientRegardedOwnerTaxDocumentation`, `SignedClientTaxDocumentation`, `VerifiedClientTaxDocumentation`), `ComprehensiveTaxDocumentation`, `ClientTaxResidency`, `ClientAddress` / `Address` / `UsStateAddress` / `CaAddress` / `AuAddress` / `GlobalAddress`, `ControllingPerson`, `Questionnaire` (`'W-FORM' | 'DPS' | 'SELF_CERTIFICATION'` — note the underscore, unlike the SDK's `"SELF-CERT"` prop), `TypeOfIncome` (`'ROYALTIES_OTHER' | 'BUSINESS_PROFITS' | 'SERVICES'`), `CountryCode`, `EUCountryCode`, `ValidationError`, `ValidationIssue`, `ErrorMessage`. Plus many `Verified*` branded types for documents that have passed validation.

## Case Converters

The REST API uses `snake_case`; the SDK/client data model uses `camelCase`. Convert between them:

```ts
import { camelCaseKeys, snakeCaseKeys } from '@taxbit/utilities';

const clientShape = camelCaseKeys(apiResponse.data);       // snake_case → camelCase (deep)
const apiPayload  = snakeCaseKeys(clientTaxDocumentation); // camelCase → snake_case (deep)
```

Also exported: `camelCase` / `snakeCase` (single-string). Types `CamelCaseKeys<T>` / `SnakeCaseKeys<T>` preserve key transformations at the type level.

## Treaty Helpers

`getTreatyCountry`, `getTreatyCountryWithholding`, `getTreatyCountryWithholdingLabel`, `getTreatyCountryLimitationsOnBenefit`, `getClaimsForCountry`, `getCountriesForIncomeTypes`, `getCountryCodesForIncomeTypes`, `getGeneralTypeOfIncome`, `getNormalizedIncomeType`, `normalizeTypesOfIncome`, `formatRateLabel`, `hasGeneralClaims`, `hasSpecialClaims`. Type: `TreatyCountry`, plus `typesOfIncomeIndividual` / `typesOfIncomeEntity` / `ALL_TYPES_OF_INCOME` lookups. Use these to build FDAP treaty-claim UIs (rates, articles, eligible income types by country).

## Security

`@taxbit/utilities` has no network calls or secrets, but the data it operates on is **tax documentation PII** (TINs, addresses, dates of birth, citizenship) subject to IRS IRC 6103 and potentially GDPR. Apply the same care as the API and React SDK skills:

- **Never log TINs, GIINs, VAT IDs, or full `ClientTaxDocumentation` objects**, even when debugging validation. Log the `path` of a `ValidationIssue`, not its `value`.
- Validators receive raw secret-adjacent values — don't echo the input into error messages, telemetry, or monitoring. Map `ErrorMessage` codes to generic localized copy.
- Treat `ClientTaxDocumentation` / `ComprehensiveTaxDocumentation` in memory as sensitive; don't persist them to localStorage, analytics, or logs.
- When generating example code, use obviously fake TINs/addresses — never real or realistic-looking values.
- Add `.env` to `.gitignore` and never commit test fixtures containing real PII. Scrub PII in Sentry/Datadog before transmission.
- Standard boundaries still apply: changes go through PRs with required checks; agents don't commit to main or deploy without human review.

## Common Integration Patterns

1. **Build a custom form** — drive `<select>` options from the lookup tuples (`exemptPayeeCodes`, `limitationOnBenefits`, `getCountryOptions()`), so your values always match what the API accepts.
2. **Inline field validation** — call `get<Field>ErrorMessages` on change/blur and render your localized copy for each returned `ErrorMessage` code.
3. **Pre-submit gate** — validate each field with the `get*ErrorMessages` helpers (and `is*` format validators) and block submission until they all return `undefined`; for a whole-object check, `assertVerified*` throws a `ValidationError` whose `issues` you can surface next to fields via their `path`.
4. **API ↔ client mapping** — `camelCaseKeys` on responses, `snakeCaseKeys` on request payloads.
5. **Type-safe branching** — use `is*TaxDocumentation` guards to narrow before rendering case-specific UI; use `assertVerified*` to fail fast (catch `ValidationError` for its `issues`).

## Full Documentation

- npm: https://www.npmjs.com/package/@taxbit/utilities
- Bundled types: `node_modules/@taxbit/utilities/dist/index.d.ts`
- Taxbit SDK docs: https://apidocs.taxbit.com/docs/component-and-hook-reference
