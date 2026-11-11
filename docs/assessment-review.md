# Review of the supplied Groq batch

This note compares the user's pasted Groq results with the manually curated baseline. It is not Acadza's hidden ground truth or faculty sign-off. The full user-generated Groq file remains on the user's laptop and has not been committed. Both sets can contain mistakes.

## Material observations

- **R042:** The Groq evidence incorrectly says 2.2 A. ε₀·10·1/(10⁻³)·25 = 2.2125×10⁻⁶ A ≈ 2.2 μA; option C is consistent. The chapter classification remains a separate faculty issue.
- **R007/R008 and R016:** Groq's student replies say changes have already been made while the route is faculty review. No such live correction occurred. Model defect drafts are now replaced with a conservative review-pending reply, including in fresh batch runs.
- **R018/R019:** Correct final answer does not make the unrelated or confusing intermediate solution valid. Baseline proposes a solution correction; a subject expert should review it.
- **R020:** A/B/D are physically correct, but the answer is stored as one comma-separated array element. The real scoring schema is not supplied; formatting is a suspected defect, not proven from this sample. Verify schema before approving any edit.
- **R021:** Only B appears correct, but MCQ does not necessarily require multiple correct choices. The empty answer element merits investigation; a type change is not proven without the platform's scoring rules.
- **R013/R014:** The supplied taxonomy includes exam_reference and markup_leak for the observed embedded exam tag and literal raw LaTeX, respectively. Classifying both solely as display issues overlooks those listed repairs.
- **R024:** The stored solution uses g = 10 m/s², but the question stem does not state that assumption. If no exam-wide convention supplies it, the integer answer depends on the chosen approximation. Confirm the convention with faculty; the proposed edit only adds the unit and does not settle the assumption.
- **R026:** Correctness of the answer does not establish syllabus alignment; keep the syllabus claim with faculty rather than dismiss it.
- **R009/R010:** The ZIP has three choices. Matching published versions list D = 5 m/s, but different variants exist and the snapshot does not establish provenance. We flag option_repair for faculty source verification and propose no automatic D insertion. See `evidence-ledger.md`.
- **R037:** The taxonomy explicitly includes slow load under display_issue; the baseline has been corrected to reflect this.
- **R040:** “wrong” is vague but not unintelligible. A content check supports the golden-rice key, so the baseline uses no_error; another unreported defect is still possible.
- **R017:** Faculty history shows the spelling fix on 7 November, after the 4 November report. The current record is fixed; the earlier baseline incorrectly said the fix predated the report, now corrected.

Run `node scripts/compare-results.js results.json results.llm.json` locally to list verdict/repair/route differences. This mechanical comparison does not verify mathematical accuracy or prove any entry is correct. Never substitute an unreviewed model file for a reviewed baseline automatically.

## Unreported-question candidate (bonus; faculty review needed)

Question `68dea6e6387eea3d0d95f6f8` has no student report. It asks for the ratio of the sizes of two images without specifying their order. With D = 150 cm and f = 24 cm, the two image magnifications are 4 and 1/4, so larger/smaller is 16, while the reverse is 1/16. The stored integer answer 16 implicitly assumes larger divided by smaller. The integer question format may be intended to imply that interpretation, so this is an ambiguity candidate, not a confirmed ground-truth defect. A faculty member could make the requested ordering explicit. No automatic edit has been applied.
