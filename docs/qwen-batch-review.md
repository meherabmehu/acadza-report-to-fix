# Complete Qwen batch and adjudication

A complete real Groq `qwen/qwen3.8-27b` run on 10 November 2026 covered all 39 reported question groups and 44 reports. `data/results-qwen-batch.json` is the batch runner output: model responses were validated, normalised, expanded to reports, unsafe edits discarded and defect replies replaced with a truthful review-pending draft. It is **not** the untouched HTTP responses. No student IDs were sent. This is not faculty sign-off or Acadza ground truth.

Compared with the prior curated baseline, 17 report rows differ in verdict, repair or route (including two new auto routes). Several issues make blind promotion unsafe:

- R004: evidence computes 4800 Pa and identifies key A as wrong, but returns `no_error`.
- R005: evidence derives q/(2ε₀) but incorrectly concludes n=2 rather than n=1.
- R016: changes answer from 20 to 40 although 800 = 2a² yields a=20; this is a harmful suggested answer-key edit.
- R034: uses an incorrect intensity formula and proposes answer C although both statements are false and no such option exists.
- R028: the model divides by sin θ cos θ without stating that cos θ must also be nonzero; the nondegenerate-case derivation is used instead.
- R039: an independent arithmetic check corroborates approximately 600 eV; the report concerns language availability.
- R044: final 14 V is correct but an intermediate formula written in the evidence is incorrect.
- R018/R019, R023/R042 and others miss issues separate from correctness of the final answer. R025, R026 and R020 remain source/schema-dependent judgement calls.

`scripts/adjudicate-batch.py` deterministically merges that batch with `data/curated-baseline.json`. It uses the baseline for every baseline defect, every verdict/repair disagreement and R028, R029, R031, R039 and R044 (32 report rows); remaining rows use the batch assessment with the case-specific baseline reply draft. This is a transparent conservative adjudication, not raw model output and not expert validation. The curated baseline itself can be wrong. All defects except the two narrowly pinned spelling fixes route to faculty review. Run `python scripts/build-results.py && python scripts/adjudicate-batch.py` to reproduce the committed output. Raw batch changes do not automatically change the pinned policy.
