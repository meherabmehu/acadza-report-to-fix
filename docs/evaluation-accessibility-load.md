> Current configuration: the owner removed login and MFA; the workspace is a public, writable sample demo. References below to previous login/session tests are historical and no longer describe the current deployment.

# Evaluation, accessibility and local load smoke test

## Accuracy: labels unavailable

Acadza's hidden per-report labels are not included in the supplied ZIP. Consequently there is **no valid accuracy, precision, recall or hidden-ground-truth score** here. `node scripts/compare-results.js data/curated-baseline.json data/results-qwen-batch.json` compares the project-authored reference with the normalized Qwen batch: 17 of 44 report rows differ on verdict, repair or route. These are disagreements, not errors or a score: both files may be wrong, are correlated with the project, and multiple reports share a question.

`node scripts/proxy-evaluation.js` checks eight deliberately selected report rows (six distinct questions) against narrow project-authored arithmetic expectations: 8/8 match the committed adjudicated output. This is a regression check, not a held-out or independent test: the expectations were selected and authored by the same project and informed the output. It does not establish general accuracy or validate all fields, subject claims, reports, edits or replies. `tests/numerical-review.test.js` exercises selected calculations independently of model execution, under the documented assumptions. A real evaluation requires Acadza's withheld labels or an independently blinded, qualified review, plus clear scoring rules and question-level grouping to avoid duplicate leakage. `node scripts/evaluate-labels.js path/to/reference.json` is ready for a complete trusted reference: it validates report IDs, question IDs and taxonomy, then reports report-weighted and question-weighted verdict and joint verdict/repair agreement plus report-weighted defect precision/recall. Question-weighted agreement averages per-question report agreement so repeated reports do not dominate. It does not establish reference provenance, assess edits or replies, or resolve correlated duplicate reports. Each JSON row must include `reportId`, `questionId`, `verdict`, and `repair` (null for non-defects); all 44 rows must be present. Do not use project predictions as reference or claim the result is independently verified.

## Automated accessibility

`e2e/accessibility.test.js` runs axe-core WCAG 2 A/AA and 2.1 A/AA checks with Playwright Chromium at 375 and 1440 px, on dashboard, queue, question bank, insights, audit, settings, case, and an approval dialog. The checks include four authoring dialog types, dialog labels, and keyboard Escape/focus restoration. This pass found low-contrast text and two unnamed filters; their colors/names were corrected. The mobile audit table was also made keyboard-focusable. No automated violations were reported in those tested states after the changes. Automated tools cover only a subset of accessibility: this is not WCAG certification, screen-reader testing, or a comprehensive keyboard, author-dialog or assistive-technology audit. Keyboard testing now also covers a skip link, page-focus transfer and titles. This is not a human screen-reader audit. Drawing on canvas requires a pointer; uploading an authorised image is an alternative.

## Local load smoke test

`node scripts/load-smoke.js` starts a separate local, unauthenticated test server with file storage and no auto-apply, and makes read-only `/api/data` requests to localhost. No production traffic, writes, external AI or PostgreSQL is exercised. On this sandbox with Node 22, 250 requests each at concurrency 10 and 25 completed with zero failed responses. Observed once:

| Requests | Concurrency | p50 | p95 | p99 | Throughput |
|---:|---:|---:|---:|---:|---:|
| 250 | 10 | 107 ms | 242 ms | 263 ms | 72.9 req/s |
| 250 | 25 | 257 ms | 585 ms | 2278 ms | 77.8 req/s |

After adding a snapshot cache keyed by the immutable in-process state object (and rebuilding only after a successful write), a second run on the same kind of sandbox produced the following. These are single runs, not a controlled or statistically robust comparison.

| Requests | Concurrency | p50 | p95 | p99 | Throughput |
|---:|---:|---:|---:|---:|---:|
| 250 | 10 | 25 ms | 40 ms | 135 ms | 321.7 req/s |
| 250 | 25 | 66 ms | 83 ms | 91 ms | 372.9 req/s |

This short in-process/local measurement is not a capacity guarantee, realistic traffic simulation or Render performance prediction. The cache is per process, increases memory use and assumes every successful mutation replaces the state object; tests cover refresh after writes and rollback. PostgreSQL writes now use a snapshot compare-and-swap: an external write discovered at the next write fails closed and requires restarting the stale process; this is not multi-instance support, since stale reads may occur before detection and sessions/caches are per process. The single-instance state design, shared password, slow external AI and database behavior under load require separate operational testing before broader usage.

## Additional security and write checks

The server sends a restrictive Content Security Policy for scripts and connections, disables unneeded browser permissions, and enforces bounded input sizes. CSP still permits inline styles because the existing UI uses them; it is defense in depth, not a substitute for sanitization. A disposable PostgreSQL integration test now submits 20 simultaneous defer decisions for distinct cases and verifies all decisions and audit entries after a restart. Another test checks that a stale second process cannot overwrite the first process's committed snapshot. These are local tests, not an independent penetration test or production-scale benchmark.

Important production gaps remain: this is a public, unauthenticated, self-declared-reviewer demo without distributed abuse controls; it is not SSO, MFA, verified per-user roles, shared/distributed sessions, automatic backups or multi-instance operation. Compare-and-swap fails closed when it detects an external writer, but reads can remain stale before detection and a stale server must be restarted. Implementing organisation-backed identities, recovery, infrastructure configuration, threat-model review and independent testing requires a real production environment and authorised services.
