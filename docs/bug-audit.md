# Bug audit and remaining limits

## Confirmed issues fixed

1. **MathML:** `mover`, `munder` and `munderover` were stripped by the sanitizer, potentially losing vector arrows and mathematical meaning. They are now allowed and browser-tested.
2. **PostgreSQL freshness:** hashing raw JSON key order could treat unchanged JSONB records as changed after restart. Canonical sorted-object hashing now survives JSONB reordering; compatible legacy hashes are accepted where possible. An older live proposal that cannot be matched is rejected as stale and must be re-run, not silently approved.
3. **Case history race:** a preview or live AI candidate created before a defer/reopen cycle could be accepted afterwards if content happened to be unchanged. Review events now invalidate it. Preview and commit remain separate and audit-backed.
4. **Faculty edit scope:** faculty option authoring could rewrite a stem, leave blanks or duplicate labels; spelling/unit authoring could bypass narrow structural guards. It now fails closed on these cases. The guards do not verify scientific truth or all HTML/MathML patterns.
5. **Diagram upload:** checking file signatures alone allowed invalid images. PNG/JPEG are decoded, and byte size, dimension, pixel count and diagram count are bounded. Interlaced PNGs are rejected because the decoder uses an unbounded inflation path for them. This is not a malware scanner or copyright verifier.
6. **Unapplied model drafts:** non-defect AI replies could claim a change was already made. All unverified live replies now use truthful preliminary wording. Actual workspace decisions have decision-aware previews; no message is sent.
7. **Text-only images:** image bytes or links could be sent to a model that cannot actually see them. Both prompts now state that image contents are unavailable, and the API sends counts instead of bytes/links. Earlier prompt versions are retained under `prompts/versions/`; historical Qwen batch data were not rewritten.
8. **Historical login limiter:** successful logins previously consumed the failure allowance. Login was subsequently removed from the public demo at the owner’s request.
9. **UI/API:** a closed auto-applied case could be counted as faculty-reviewed; a pending auto case had no dedicated filter; a stale proposal could be rendered as an after-preview on a closed case. The UI now distinguishes these. Malformed/oversize/unknown API requests return JSON errors rather than an HTML fallback.

10. **Prototype IDs:** unknown IDs such as `toString` could resolve inherited object properties. Case and AI lookup now requires an actual known question ID; regression tests cover inherited-property names and no audit mutation.
11. **Stale baseline changes:** approval/edit now requires the question hash shown to the reviewer. Changes made in another tab cause a 409 instead of applying an outdated content patch. API clients must send `questionHash` from `/api/data` for approve/edit.
12. **Audit and bank labels:** audit filtering now includes automatic and authored fixes; questions without reports are marked “Not assessed”, not “No change”.

13. **Stale review history:** an old baseline tab could still apply a patch after a defer/reopen cycle when content was unchanged. Content-changing decisions now bind both the question hash and the latest review-event version; an intervening event returns 409. The client refreshes before retrying.

## Test scope

Node unit and integration tests, actual PostgreSQL persistence/failure/restart and Chromium E2E tests cover the sample workflow. Navigation is checked at 375, 768 and 1440 px. The batch results are checked for one row per report and reproducibility. Navigation and case rendering were additionally tested in Firefox and WebKit at the same three widths. This limited browser check is not an exhaustive cross-browser or accessibility audit, security review, production load test, or scientific/faculty sign-off.

## Residual design limitations

Single process/single workspace snapshot only; public reviewer identity is self-declared; in-progress previews are lost on restart. Model checks remain probabilistic, historical results are not a hidden-ground-truth comparison, and sample-specific numerical guards cover only a few unchanged stems. External diagram rights and technical/scientific correctness remain reviewer responsibilities. Limits and free-host behaviour are documented in the deployment guide.
