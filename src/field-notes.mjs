// Hand-written notes for request body fields whose format the OpenAPI spec
// doesn't explain, appended to that field's description wherever it appears
// in skills/api/reference/. Format rules only: the API's validation response
// is the source of truth for exact per-country values.
export const FIELD_NOTES = {
  treaty_claim_article_paragraph:
    'The treaty\'s article reference only, without the words "Article" or "Paragraph": for example `12(1)`, `7(1)`, `21`, or `10(2)(b)`. '
    + 'It must match the reference Taxbit holds exactly for the treaty country and type of income; the docs\' sample "Article 12, Paragraph 1" is rejected. '
    + 'If the claim comes back `INCOMPLETE_TREATY_CLAIM` with "not an acceptable value", the reference is wrong for that country and income type.',
  treaty_claim_rate_of_withholding:
    'The percentage as a plain number string, without a % sign: `"0"`, `"5"`, `"15"`.',
  treaty_claim_has_additional_conditions:
    '`true` when the treaty requires the claimant to meet additional conditions for this claim. Business profits and other income always do; royalties depend on the country. '
    + 'If the claim comes back saying additional conditions "must be checked", set it to `true`.',
};
