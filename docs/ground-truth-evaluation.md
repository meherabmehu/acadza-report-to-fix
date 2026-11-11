# How to obtain and evaluate ground-truth labels

The assignment states that Acadza knows the true answer for each report. The provided ZIP does not contain those answers. Only Acadza (or an authorised independent review) can supply a reference. This project cannot reconstruct a hidden answer key or prove that its own assessments are correct by treating them as labels.

Ask the assignment contact whether they can share a labelled evaluation file, or run the committed `results.json` against their private grading system and return a breakdown. They may keep labels private to preserve the evaluation. Do not upload confidential labels publicly without their permission.

For the local evaluator, a reference JSON array must include exactly one row for each of the 44 supplied `reportId` values. Each row needs the matching `questionId`, a verdict from `data/taxonomy.json`, and `repair`: a valid repair key for a defect or `null` for a non-defect. If Acadza supplies a different format, convert it without changing the meaning and retain the original securely. Example structure only (not a real label):

```json
[{"reportId":"<report ID>","questionId":"<matching question ID>","verdict":"<taxonomy verdict>","repair":null}]
```

The example is illustrative and incomplete; it is not valid evaluator input. Run from the repository root after providing the complete file:

```bash
node scripts/evaluate-labels.js /path/to/private-labels.json results.json
```

The tool validates coverage, IDs and taxonomy, then reports verdict and joint verdict/repair agreement, defect precision/recall, plus question-weighted agreement. Report-level rows share questions, so they are not independent. The tool does not verify label provenance, grade the actual edit or student reply, calculate a hidden assignment score, or establish generalisation to new questions. Do not commit private labels or present the project's own outputs as independent ground truth.
