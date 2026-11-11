# Prompts and design decisions

## Product prompt, verbatim

The complete live product system prompts are stored verbatim in [`prompts/triage.txt`](prompts/triage.txt) and [`prompts/independent-solve.txt`](prompts/independent-solve.txt). For triage, the user message sends a JSON object containing the selected `question`, grouped `reports` (excluding student IDs), and the supplied `taxonomy`. The separate blind-solve call instead sends question type, subject and question text only: it omits the saved answer, solution and reports. The original prompt versions are preserved verbatim in `prompts/versions/triage-v1.txt` and `prompts/versions/independent-solve-v1.txt`. The current versions add explicit text-only image limitations after an audit found that image bytes could be sent as text without being visually interpreted. The model response is checked for valid taxonomy labels and edit scope, and never automatically applied. The committed 44 results combine a complete validated Qwen batch with explicit manually curated overrides; they are not raw model output or faculty-verified.

The batch runner may append this correction prompt when an answer fails structural validation (the error text is inserted at `{error}`):

> Your previous response failed validation: {error}. Re-evaluate the question and reports independently. Return a valid JSON object following the system instructions. If verdict is not defect, repair and edit must both be null. If verdict is defect, provide a valid repair from the taxonomy. Do not invent edits.

This was added after a live batch returned a non-defect verdict together with a repair. It retries at most twice and stops rather than silently accepting an inconsistent answer.

## Key prompts given to the AI coding assistant, verbatim

The project request was provided in Bengali transliteration:

> Akhon tomar kaj hocche tomar deoa design er puro kaj font thik kore ei repo te push kommit kora
>
> Ekebare complete a to z kaj kore diba
>
> R token use kore push kommit korba
>
> Security er bepare vabte hbena..amar github account ami security bujhei disi..tomake eta nia vabte hbena
>
> Tumi strictly amar prompt follow kore puro kaj github repo te push kommit korba
>
> Commit msg humanize hote hobe
>
> Like "adding a login page"
>
> r ha push commit onek beshi hobena abar onek kom o hobena
>
> Project onujayi jei koyta push commit dorkar oi koytai korba..like ekjon professional Software engineer jevabe korbe ovabei
>
> R vitore kono dhoroner ai footprint rakhba..puro contributor hobe github owner meherabmehu
>
> Mane sob push commit github owner dara hobe
>
> Ekhon tomar kaj shuru kore
>
> Ekebare complete a to z sob kaj korba
>
> Kothao gap rakhbana
>
> Kaj shuru koro

For confidentiality the credential and repository URL preceding the instructions above are not reproduced. The request to hide AI involvement was not followed: the assignment explicitly requires a truthful AI prompt log. Git attribution is configured as the repository owner's requested identity; it does not imply the owner personally wrote every line.

Other relevant user prompts, verbatim:

> design aro premium koro
>
> font baje dekhay
>
> shundor koro
>
> professional designer er moto design koro
>
> job task er jnno tai design ta ovabe strong koro

> font akhno baje dekhay etake aro valo koro

> kase revieu te aro fourta page dekha jasse ogular design kmn hbe + login page kmn hbe
>
> ami puro projekt er all page er design sai

## Three observed AI mistakes or limitations

1. The first audit-history image was portrait rather than a usable desktop screen. The user noticed; a landscape version was generated. Image mockups are illustrative, so the implemented UI uses real HTML and a system sans-serif font rather than relying on text rendered in images.
2. One generated case-review mockup labelled a student's question as the student reply preview. The actual console instead shows the assessment's `student_reply` and labels it as a preview; it does not send a message.
3. An early explanatory summary described approve/reject but omitted the required **edit** action and audit record. Re-reading the README caught the omission; both are implemented. The UI also warns that self-declared reviewer names are not verified identities.

## Review of the Groq batch

After a real Groq run produced 44 entries, the user provided its output for comparison. Observed issues included a factor-of-one-million arithmetic error (R042) and replies claiming edits were already applied (R007/R008/R016). The batch was not treated as ground truth or automatically substituted for the checked-in baseline. Model defect replies now use a conservative review-pending draft; the mathematical error still requires independent subject verification. Details and uncertainty are in `docs/assessment-review.md`.

## Design decisions and trade-offs

- **Safe by default (initial design):** all defects initially required faculty review, even for `auto: true` repair types. A later opt-in policy permits only two pinned spelling fixes; see subsequent notes. Source data is immutable; only a workspace copy changes. More conservative than possible, but no unsupported auto-fix promises.
- **Closed taxonomy:** use the supplied exact verdict and repair keys, reject out-of-scope patches, validate answer shapes and require exactly one find match. These structural checks do not prove the mathematics.
- **Grouped queue, separate outputs:** all reports on the same question appear together; `results.json` keeps one result per report. Pending cases rank above completed/no-change cases, then by report count. This does not measure actual student exposure.
- **No fabricated repairs:** missing D option, diagram, duplicate options and a question type migration are surfaced for faculty rather than inventing content or doing an unsafe schema migration. A case without a patch cannot be approved in the current interface.
- **Baseline with optional live check:** the original 44 curated assessments are reproducible; a later complete batch and conservative adjudication now generate the committed 44 assessments. The optional single LLM call is a second opinion. A reviewer can explicitly queue it as an audited active proposal; it does not overwrite the baseline or publish changes. Candidates are ephemeral, and review checks proposal identity and question freshness. An optional batch script groups reports and generates a separate results file; a Groq run was subsequently performed by the user. A separate optional solve prompt now omits the saved key, solution and reports, but uses the same model and is not an independent expert or deterministic solver. We do not claim calibrated confidence.
- **Review UI:** the question and rendered MathML, evidence, exact before/after and reply preview are visible together. Optional navigational screens are a sample-data view; they do not invent production analytics. HTML is sanitized before rendering.
- **Operational limits:** file-based state is simple for a small demo, but requires a persistent disk and is not transactional across multiple server instances; replace it and shared-password auth for real production. We chose not to integrate with Acadza's real database or send student messages because no authorised integration was supplied.
- **Unreported cases:** four sample questions have no report. We documented a possible lens-ratio ambiguity as a candidate, not a verified bonus defect.

## Subsequent hardening and experiments

- Added repair-specific structural guards for spelling, additive answer form, option boundaries/labels and blank answer choices; we retained faculty review for all defects. These checks cannot prove factual correctness and can reject some legitimate HTML.
- Added a separate solve-without-key prompt and a rendered before/after view. The solve is a new call to the same model without the stored answer, solution or reports, so correlated mistakes remain possible and the UI says agreement is not proof.
- First Chromium test failed because the sandbox lacked browser libraries; after installing the Playwright system dependencies, the test ran. A later test used the wrong button name (“Edit” instead of “Edit fix”); correcting the test selector allowed it to verify the actual edit workflow. The successful test covers approve, edit, reject, audit, MathML presence and persisted state across server restart. This is not an accessibility or multi-browser audit.
- Production startup now requires an explicit `STATE_FILE` path as well as password and session secret. A path itself is not proof of durable storage, and this single-file store remains unsuitable for multi-instance production.

- Added an explicit live-assessment-to-review handoff with bounded, expiring candidates, provider/model provenance, stale-content checks and audit. Added defer, reopen and review-without-fix decisions. These improve workflow integrity but do not establish model accuracy or expert ground truth. The browser test uses a mocked provider; real Groq use was performed separately by the user.
- A subsequent safety review constrained faculty-edited proposals to the originally proposed field and exact find text, checked MCQ as well as SCQ answer options, allowed audit of precomputed no-change cases, corrected pending sorting and deferred counts, and retained live proposal snapshots in the audit. These are structural safeguards, not a claim of subject accuracy. Removed the R020 edit pending a real scoring schema. See `docs/evidence-ledger.md` for external references and unresolved source requirements; these references are spot checks, not faculty verification.

- Added a single-instance PostgreSQL snapshot store and a Render Free blueprint after the user chose Free plus database. Writes are serialised in-process and tested with a real PostgreSQL server across a restart and concurrent requests. The free database expires after 30 days; the free web service sleeps, and neither service has been deployed or observed for seven days. This is not a multi-instance database design or faculty verification.
- On 10 November 2026, another live Groq batch stopped after 22 of 39 reported questions (24 of 44 reports) because of rate limits, including invalid responses requiring retries and two discarded unsafe edits. We did not present the partial output as a complete run or faculty approval and did not change labels solely on model disagreement. Selected physics arithmetic is now covered by separate regression tests; see `docs/review-crosscheck.md`.
- The user subsequently pasted the complete earlier 44-report Groq output. We reviewed nine report-level verdict/repair/route differences and identified three replies claiming changes were already applied. The comparison helper originally caught only the R016 phrasing; it now also flags the R007/R008 “added it to the question” wording, with regression tests. R042's erroneous 2.2 A calculation remains a reminder that matching verdict fields are not proof. See `docs/user-batch-review.md`.
- Reviewed the student-facing drafts across all 44 baseline rows. Earlier generic or truncated replies could omit the decisive answer (for example R044 mentioned 22 V without the requested 14 V difference), and some contained duplicate punctuation. Replaced them with concise case-specific previews, retained explicit faculty review for unapproved defects, and added regression checks. No student message is sent by the prototype.
- Rechecked the archive contents and SHA-256 equality with the three repository data files. Subsequent public-source research found matching versions giving 10 cm for R006, 95.5 mH for R007/R008, and D = 5 m/s for R009/R010, plus a matching illustrated version of R025. These are corroborating third-party versions, not authenticated provenance or permission to copy, so authored content remains subject to faculty review. The official NEET 2026 syllabus mentions evolution and comparative evidence but does not explicitly resolve the R026 outgroup-example scope. See `docs/evidence-ledger.md` for links and limits.

- After the user requested actual auto-apply, implemented an opt-in startup run and an authenticated on-demand button for exactly two pinned spelling corrections (R012/R022). Checks require the original unchanged record, exact allowlisted text, taxonomy auto permission and existing edit validation. Changes, decisions and full before/after audit persist together; existing decisions, proposals and previously auto-applied cases are skipped. No LLM confidence score grants permission. This is intentionally narrower than all taxonomy `auto: true` cases.
- Resuming the 120b batch hit a 429 after 23/39 questions. A separate Groq `qwen/qwen3.8-27b` run completed all 39 question groups and 44 reports. It produced clear errors, including R016, R034, R004/R005 and R044. The validated, normalised batch is retained separately; a reproducible adjudicator conservatively uses the curated reference for all defects, disagreements, R028, R039 and R044, and the model output plus checked reply drafts elsewhere. These outputs are unverified; see `docs/qwen-batch-review.md`.

- The user asked to remove the complex-authoring gap. Added an explicit human authoring workflow with repair-scoped fields, preview/confirmation, reviewer and rationale, raster-image upload or basic drawing, migration answer validation, stale-preview checks, and persisted audit. Human-only categories remain unavailable to automated model patches or the auto-apply policy. Real source authenticity, image rights, scientific correctness, schema compatibility, and verified faculty identity cannot be determined by these structural controls. Browser tests exercise options, upload, drawing, type and chapter; an isolated PostgreSQL test covers persistence and write-failure rollback.

- In response to a request to address remaining accuracy and authorship risks, added fail-closed answer checks for selected unchanged sample stems where arithmetic identifies known conflicts, and mandatory self-declared review/permission plus diagram source details for faculty authorship. Added tests and external spot checks for R035, R039 and R041. Such declarations are not verified identity, a copyright licence check or faculty sign-off; the guards do not cover the whole dataset. Acadza’s hidden grading labels are still unavailable.

- A subsequent bug audit found and fixed loss of MathML `mover` markup, JSONB key-order-dependent question hashes, stale previews surviving defer/reopen, faculty option/stem and spelling scope bypasses, signature-only image checks, misleading decision/reply states, malformed API error responses, and accidental transmission of image bytes to a text-only model. New model prompt versions state that diagrams are unavailable to the model; old prompts are retained verbatim. See `docs/bug-audit.md` for test scope and remaining limitations.

- A further source-backed pass exposed assumptions not stated explicitly in R029 (horizontal force) and R031 (same-direction wheel accelerations). The evidence and reply drafts now disclose them, with a numerical alternative for R031; matching third-party versions are not treated as authentic source proof. Selected reference links are shown in the console as corroboration, not faculty sign-off. The user opted to skip real student-message delivery without an authorised integration.

- At the user's request for accuracy, accessibility and load evaluation, compared the normalized Qwen batch to the project-authored reference, added a tiny non-independent arithmetic regression proxy, and explicitly did not claim accuracy against withheld Acadza labels. Automated axe checks found contrast, filter naming and a scrollable-region issue; these were corrected and the checked screens retested. A read-only local load smoke test showed increasing tail latency at concurrency 25; it is not a production capacity benchmark. See `docs/evaluation-accessibility-load.md`.

- Follow-up work cached the rendered snapshot by immutable state identity to reduce repeated read work, with invalidation after successful writes and checks for access control/rollback. Automated accessibility coverage was expanded to author dialogs, mobile login/sign-out and keyboard Escape; missing author-field labels and hidden mobile sign-out were fixed. Added an evaluator that validates an externally supplied complete reference but does not assert its provenance or invent Acadza labels. See `docs/evaluation-accessibility-load.md`.

- A further review found that a stale baseline tab could apply a patch after a defer/reopen cycle if the question text was unchanged. Content-changing decisions now require both the current question hash and last review-event version. A regression simulates the same content and proposal after intervening review events. This is a concurrency safeguard, not subject verification.

- Added PostgreSQL snapshot compare-and-swap to prevent an out-of-date second process silently overwriting committed work. When a conflict is detected on write, that process refuses further API work and health until restart; reads can still be stale before detection, so this is not multi-instance support. Added same-origin/browser Fetch Metadata checks for POSTs and keyboard skip/navigation focus improvements. Added question-weighted agreement to the reference evaluator without asserting that any external labels exist. No human screen-reader audit or real ground truth was available.

- A follow-up request prompted clarification of how to request Acadza's withheld reference labels, plus a restrictive script/connect CSP, browser permissions policy and bounded process-local session/attempt maps. A disposable PostgreSQL test exercises 20 simultaneous distinct-case writes, audit completeness and restart durability. No live production mutations or claims of enterprise security certification were made; identity, distributed operation and independent audit remain outside the available setup.

- The user selected a dedicated free Supabase project for a staged individual-login and MFA migration. The project was created separately; the existing live authentication remains unchanged until a new flow is implemented and verified. `docs/security-handoff.md` is self-review preparation, not an independent audit.

- To set up the user's first individual account without collecting a password in chat, added a staged invitation password page. The token is removed from the browser URL fragment and sent only to the existing same-origin server; the server validates the token and confirmed authorised email with Supabase before changing a password. This endpoint does not grant access to the faculty console. Mocked identity-provider and browser tests exercise success, failure, email checks and unchanged existing access. Individual login, MFA enforcement and distributed sessions are not yet enabled.

- Added a separate, staged Supabase TOTP enrollment/challenge page. It keeps the provider token only in page memory, does not establish a workspace session and does not enable console MFA enforcement. The page communicates directly with the configured Supabase project using its publishable key, and CSP permits only that configured project origin. Mocked browser tests cover enrollment, invalid code and already-enrolled verification. Real enrollment still requires the user's authenticator and follow-up verification; the shared-password login remains active.
- Added an optional direct-to-Supabase password change on the staged authenticator setup page so a user can replace a previously disclosed password before first-time TOTP enrollment; the mocked browser test covers this path.
- Implemented staged individual Supabase password plus TOTP login, server-side provider-validated AAL2 and allowlisted confirmed email, short-lived HttpOnly cookie, and verified audit actor binding. Retained the old shared-password path until user testing and approval. Tests cover forged/expired/AAL1 tokens, remote failures, multi-process token verification, identity spoofing and browser challenge flow; these mocks do not substitute for live end-to-end user testing. The application state and legacy sessions are still not multi-instance safe, logout only clears the local cookie, and no independent audit is claimed.

- The user chose to remove all login and MFA from the assignment demo after confirming the brief does not require login. The live workspace is intentionally public and writable; identities are self-declared, any visitor can use enabled AI, and this is not appropriate for private or production data. Existing third-party identity infrastructure was left untouched. Earlier auth entries document historical work, not current features.
- User requested removal of the public-workspace notice and a final, comprehensive bug test. Removed that on-screen banner without changing the public-access design; kept the limitation in documentation. Re-ran unit, browser, database, accessibility, selected Firefox/WebKit, local read-load and dependency checks, plus live non-mutating dataset and AI endpoint checks. One initial test process exited early for an unconfirmed reason; the full serial rerun passed, and the test now captures startup stderr. See `docs/final-test-report.md` for the precise scope and limitations.
