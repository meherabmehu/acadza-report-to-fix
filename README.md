# Acadza · Report to Fix

A faculty-first review workspace for the supplied Acadza sample. Student reports are grouped by question; reviewers can inspect the original question, MathML solution, evidence, proposed change and student reply, then approve, edit or reject a proposed patch, defer investigation, or record a review without a content change. Every decision is recorded. Changes apply **only to this workspace snapshot**, never to Acadza's production database.

## Quick start

Requires Node.js 22.12 or newer (Node.js LTS recommended).

```bash
npm ci
npm test
npm start
# Open http://localhost:3001
```

This is an **unauthenticated public demo**. Anyone who can reach it can view the sample workspace, record review decisions, change its data, and use enabled live AI. Reviewer names are self-declared. Do not use real, sensitive, private or production data. Audit records can be changed or forged by a visitor and are not trustworthy evidence of identity. Do not present this as a secure production deployment.

`state.json` stores decisions and edited snapshots unless `DATABASE_URL` is configured; the supplied source JSON is never overwritten. Delete `state.json` while the server is stopped to reset the local file demo. The deployed database is a separate store.

### Deployment configuration

- `NODE_ENV=production` and `DATABASE_URL` for PostgreSQL, or `STATE_FILE` pointing to a persistent writable file. Production startup fails when neither is set. A configured but unreachable database fails closed.
- `PORT` defaults to 3001; the host can override it.
- `AUTO_APPLY_SAFE=true` optionally runs the two pinned spelling corrections on startup. Default is off.
- `AI_PROVIDER=groq` and `GROQ_API_KEY` optionally enable live checks; alternatively use OpenAI. Keep keys in host environment settings, never in the repository. The public live-AI endpoints can be used by anyone and can exhaust quota or incur charges. Use free provider limits and monitor usage.

Browser cross-site POST requests are blocked where Origin/Fetch Metadata is present, but this does not authenticate visitors or prevent direct use of the public API. No independent security audit has been performed. For real data, build verified identity, access controls, session management, abuse controls and review the design independently before deployment.

For Render Free with PostgreSQL, `render.yaml` provides a web service and database blueprint; see `docs/render-deployment.md`. The file and database are separate stores: choosing PostgreSQL does not import an existing local `state.json`. PostgreSQL stores one atomic JSON snapshot, with writes serialised within a single server process. A database compare-and-swap rejects an external conflicting write and the stale process fails closed until restarted; stale reads before a conflict is detected remain possible. Use exactly one web instance; this is not a multi-instance transactional workflow or a backup system. Free services sleep and the free database expires; verify availability and seven-day uptime after deploying. Never claim a deployment is live before checking it.

## Browser end-to-end test

After `npm ci`, run `npx playwright install chromium` once, then `npm run test:e2e`. To exercise real PostgreSQL, set `ACADZA_TEST_DATABASE_URL` to a **disposable dedicated database** before `npm test`: this test drops its `acadza_workspace` table; without it the PostgreSQL test is skipped. On Linux, Playwright may also require OS libraries (`npx playwright install-deps chromium`). The test opens a real headless Chromium browser, queues a mocked live assessment, reviews a case, checks the audit log after a server restart, rejects a case, edits a spelling fix, and exercises defer, reopen and review without a fix. It uses an isolated temporary state file. This was tested in Chromium; it is not a full cross-browser or accessibility audit.

## How the sample results were produced

`results.json` contains one precomputed assessment per report. A complete Groq Qwen batch is preserved in `data/results-qwen-batch.json` (validated and normalised by the batch runner). The reproducible `scripts/adjudicate-batch.py` combines it with the AI-assisted, manually curated `data/curated-baseline.json`: all baseline defects, disagreements, R028, R029, R031, R039 and R044 use the conservative baseline; other cases use batch assessments with the checked reply draft. This is **batch-derived with explicit overrides, not raw model output or faculty verification**. Some model outputs contain clear mathematical errors; see `docs/qwen-batch-review.md`. Confidence values are uncalibrated estimates; no hidden ground truth or accuracy claim is available.

To regenerate: `python scripts/build-results.py` then `python scripts/adjudicate-batch.py`. The former rebuilds the curated reference, the latter combines it with the saved complete batch.

The optional live check calls Groq or OpenAI through their respective Chat Completions endpoint on the server, using the prompt in `prompts/triage.txt`. It sends the selected question, related report comments and taxonomy to the provider (student IDs and image bytes/links are omitted; image counts are included); do not enable it for data you are not authorised to share. The live assessment is displayed separately and **never automatically applies an edit or overwrites `results.json`**. For reported questions, a reviewer may explicitly queue it as the active, audited proposal; even a no-error conclusion is routed for faculty review. A validated faculty decision can apply a patch to the workspace copy; a separate pinned policy can apply two specific baseline spelling fixes. The raw candidate expires after 15 minutes or on restart and cannot be queued if the question has changed. The saved proposal and source model persist in the state file. Stale proposals and conflicting decisions are rejected. Deferred and closed cases must be reopened before a new assessment is queued. We validate model taxonomy keys and any edit's field scope and exact match, and discard invalid edits. The separate **Solve without answer key** button makes another model call using the question only, omitting the saved answer, solution and reports. Both calls use the same selected model and cannot see images: agreement is not proof or an independent expert verification. Neither button applies changes. No API key is required to inspect or review the precomputed cases.

For an optional **model-generated batch**, set `GROQ_API_KEY` (and optionally `AI_PROVIDER=groq`), or set `OPENAI_API_KEY`, and run `node scripts/run-triage.js results.llm.json`. It groups reports by question, makes one model call per group and expands the assessment to one row per report. It validates response shape and patch scope, sends no changes to the workspace, and writes its final output only if every call succeeds. After each successfully assessed question, a local ignored checkpoint is written next to the output. If a response fails structural validation, the script asks the model to reconsider up to twice rather than silently accepting it. On a 429, the script waits and retries a limited number of times; if it stops, run the same command to resume. If a daily limit is exhausted, wait for your provider quota to reset. The checkpoint fingerprints the data, prompt and model; deleting or moving it starts a fresh run. It does not replace `results.json` automatically; review and adjudicate any new batch first. Model calls cost money and depend on network/provider availability; the user has run a Groq batch locally, but that file is not included in the repository. Before real use, implement independent subject-matter checks, an evaluation set, confidence calibration and controlled rollout.

## Comparing a completed model run

Run `node scripts/compare-results.js results.json results.llm.json` to list differences in verdict, repair and route, and flag some replies that may claim a fix was already applied. This is a mechanical screening tool, not an accuracy or mathematical verification. See `docs/assessment-review.md` for observations from the user's supplied Groq batch and `docs/evidence-ledger.md` for reference-backed spot checks and a provisional 44-report handoff. Neither is faculty sign-off. Fresh model defect replies use a conservative faculty-review draft; past output files are not retroactively changed.

## Review and safety

- The queue groups reports by question, ranks unresolved faculty-review cases first and then by report volume. This simple priority is a proxy for repeated impact, not a real student reach metric.
- Two pinned spelling patches (R012 and R022) may be automatically applied by the narrow opt-in policy. Other defects go to faculty review. The policy checks the original unchanged question, exact edit, closed taxonomy and repair validation; confidence alone never authorises a change. Precomputed non-defect cases remain visible as no-change; explicitly queued live assessments always require faculty review. A review without a fix records a decision only and does not assert that a correction was made.
- The decision endpoint checks taxonomy field scope, requires a unique exact text match or current answer match, validates answer shape and rejects stale or repeated decisions. For approve/edit, API clients must send the current `questionHash` and `reviewVersion` from `/api/data`; intervening review actions invalidate a stale tab even if the question text is unchanged. Additional conservative checks reject numeric/symbol changes in spelling, non-additive answer-form edits, stem changes or changed labels in option repairs, unsafe active content, non-removal noise/exam-reference edits, and SCQ/MCQ keys pointing to absent, ambiguous or blank options. These are structural checks, not a mathematical or semantic proof, and may reject valid complex markup. A reject records no content edit. Repairs with `auto: false` never have a patch applied by the built-in editor.
- Selected high-stakes numerical cases have a sample-specific fail-closed guard: for the unchanged supplied stems of R001–R005, R016 and R034, certain conflicting answer-key changes are rejected based on separately checked arithmetic. A changed stem is outside this guard. The guard is not a general solver or faculty verification.
- Faculty can edit a proposed patch, or use **Author a fix** to create a reviewed correction even when no patch exists. Authoring is scoped by repair: options/question text, solutions/answers for unsound or mismatched questions, a PNG/JPEG diagram (upload under 150 KB, at most 2048 px per side and 2 million pixels; PNG must be non-interlaced, or use simple freehand drawing), chapter reclassification, and question-type migration with a validated new answer. The author selects fields, previews server-sanitized before/after, then confirms with a reviewer name, rationale and explicit review/rights declaration. Adding or replacing a diagram also requires a description of its source or original authorship; this declaration is not independently verified. The preview expires in 15 minutes or on restart; intervening review actions, stale questions, changed proposals, duplicate submissions and out-of-scope fields are rejected. Up to five diagrams are supported per question, and their bytes must decode successfully. State, decision and full before/after audit are persisted together. This human-authored workflow is separate from taxonomy-limited AI patches and is never auto-applied. Faculty may add, replace or remove an image by its list position; the drawing canvas is basic rather than a full-featured image editor. External image references are not loaded in the console. Chapter labels and migrated scoring semantics are not verified against Acadza’s real taxonomy/schema.
- Matching public versions suggest a possible D for R009/R010, but their exact source is unverified; we do not insert it automatically. All authored content and permissions remain the reviewer’s responsibility. Reviewer names are self-declared, so this is not verified faculty identity or expert sign-off.
- HTML is sanitized on the server before it is rendered; MathML is retained. Report text, audit details and model output are escaped in the client. No student messages are actually sent.
- Per-question decisions guard duplicate edits. A deferred or closed case can be reopened with an audit note; reopening does not undo an applied edit. Audit log entries contain full before/after fields and are persisted with the workspace snapshot in one local JSON file. PostgreSQL persistence is available for this single-instance demo, but stronger concurrency control, backups and authenticated identities are needed for production.

## Project layout

- `data/`: provided production-format sample and closed taxonomy.
- `results.json`: 44 batch-derived, conservatively adjudicated report assessments.
- `scripts/build-results.py`, `scripts/adjudicate-batch.py`: reproducible curated reference and batch adjudication.
- `prompts/triage.txt`, `prompts/independent-solve.txt`: verbatim prompts for the live checks.
- `authoring.js`, `auto-policy.js`, `canonical.js`, `lib.js`, `model.js`, `server.js`: patch and model validation, local state, API, optional model request and public demo API.
- `public/`: responsive faculty console, with native MathML.
- `tests/`: structural and safety checks; `e2e/`: browser review-flow test.
- `assignment-brief.md`: original assignment instructions.
- `PROMPTS.md`, `PRODUCT.md`: decision and product notes.
