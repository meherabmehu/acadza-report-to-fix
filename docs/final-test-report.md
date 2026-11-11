# Final test report

Test date: 2026-11-10. This is a scope-limited test report, not a warranty that all bugs are fixed, independent security audit, accessibility certification, or accuracy evaluation against Acadza's hidden ground truth.

- Node tests and browser tests, run serially against disposable file storage and PostgreSQL: 57 passed, zero failed or skipped on the final complete run. The suite includes validation, report/result completeness, decision and authoring guards, audit persistence, PostgreSQL write failure/restart, stale external writer and 20 concurrent writes, public access, security headers, request validation, accessibility checks, Chromium UI navigation and mocked AI workflows. A separate focused browser run checked that the removed public notice is absent.
- One earlier full test run had a child server exit early in the auto-apply restart test while another local smoke test was running; the error was not captured, so its cause is unconfirmed. The complete serial rerun passed. That test's startup failure diagnostics were improved; the random port selection in the test suite can still cause occasional collisions.
- Firefox and WebKit: navigation/case rendering passed at 375, 768 and 1440 pixels, in addition to Chromium tests. These are selected workflows, not full cross-browser coverage. Axe checks are automated and not a screen-reader audit.
- `npm audit`: zero reported vulnerabilities at test time.
- Live read-only checks: 43 questions, 44 distinct reports, 44 assessment rows covering those reports, no invalid report-to-question links, and student ID fields omitted from the API. Data and counts can change because the workspace is public.
- Live AI check and independent-solve endpoints each returned HTTP 200 and expected response fields on one selected request. Output quality, AI availability and provider rate limits are not guaranteed; these calls did not queue or commit a review.
- Local-only read smoke: 250 `/api/data` reads each at concurrency 10 and 25, zero failures. This does not measure production load, writes, AI, PostgreSQL throughput or multi-instance safety.
- Project-authored narrow proxy: 8/8 selected report rows match project-authored expectations. This is not independent ground truth, a blind test or a dataset accuracy claim.

The public demo has no login: anyone may view and change workspace content and use enabled AI, and reviewer names are unverified. Audit records are not proof of identity, faculty sign-off or an independent security audit. Private or sensitive data must not be used in this setup. External expert review, production hardening and true ground-truth evaluation remain outside the completed tests.
