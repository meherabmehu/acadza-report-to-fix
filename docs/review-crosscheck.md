# Fresh AI cross-check and faculty handoff

Status: **incomplete AI cross-check, not faculty verification**. On 10 November 2026, a fresh Groq batch using `openai/gpt-oss-120b` stopped on a provider rate limit. Its saved checkpoint contained 22 of 39 reported questions, covering 24 of 44 reports; no final 44-report batch was produced. The earlier user-run Groq file on their laptop was not available for this run. Both Groq and the curated baseline can be wrong, and the fresh call is not an independent faculty review or ground truth.

Comparison of completed rows found these verdict or repair differences:

| Reports | Baseline | Fresh Groq | Why this remains provisional |
|---|---|---|---|
| R025 | defect / diagram | display_issue | The referenced figure is absent from the supplied question record. A matching published IIT-JEE 2008 reproduction includes a figure; provenance, authorised use and client rendering still need checking. See `evidence-ledger.md`. |
| R026 | defect / syllabus | no_error | Groq correctly discusses the outgroup answer but asserts syllabus inclusion without establishing the applicable year. The official 2026 syllabus includes evolution and comparative-anatomy evidence, but the scope of this exact example remains a judgement. A correct answer alone does not settle the report. See `evidence-ledger.md`. |
| R034 | defect / unsound | defect / answer_key | Groq's evidence itself says both statements are false and no option matches. Merely changing the stored key cannot select a missing both-false choice. Faculty authorship is needed. |
| R041 | not_actionable | no_error | The report is unintelligible; the response depends on how the closed taxonomy handles a nonsensical report when the checked key appears correct. This is a classification judgement, not a verified hidden label. |

No baseline label was changed solely because the model disagreed. Model-generated suggestions were not applied. Some earlier model responses had invalid taxonomy combinations and required retries; the validator also discarded two unsafe or non-matching edits. These issues further demonstrate why model output is not authoritative.

## Independent numerical regression checks

`tests/numerical-review.test.js` checks arithmetic and units for selected physics cases, separately from the model: R001–R008, R018–R019, R024, R027, R029, R031–R034 and R042–R044. Conditional assumptions are documented in the test. Arithmetic tests cannot establish that a transcription, intended question, taxonomy label or scoring schema is correct, nor can they certify all 44 cases.

## Human sign-off required

A separate 44-report review workbook was generated for the user with all decisions initially marked PENDING. A qualified faculty member must inspect the full rendered question, reports, before/after, sources and applicable exam rules, then record their own decision, evidence, identity and date. Do not label any case faculty-verified until that occurs. Ask Acadza for hidden labels or the original figure/scoring contract when needed. See `evidence-ledger.md` for the existing reference-backed spot checks and outstanding source questions.
