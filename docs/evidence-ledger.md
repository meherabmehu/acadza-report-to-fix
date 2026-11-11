# Evidence ledger and faculty handoff

**Status: provisional, not faculty-verified or Acadza ground truth.** Reviewed by an AI assistant against the supplied question, report, current solution and selected external reference material. The table is an assessment ledger, not proof that every entry has an independent external check. Acadza holds the hidden grading labels; no faculty credentials, expert sign-off, original missing figures, scoring schema or exam-wide conventions were supplied. A self-declared name in this demo is not identity verification. Subject experts must review the actual question, evidence, applicable conventions and any proposal before approving or recording their decisions in the console. Never mark these entries as verified merely because they appear here.

## Original ZIP inventory and integrity

The original assignment archive has exactly four files: `README.md`, `data/questions.json`, `data/reports.json`, and `data/taxonomy.json`. The three committed data files match the archive **byte for byte**. The sample contains 43 questions and 44 reports; no populated question or solution image arrays were found. The archive contains no separate images, scoring implementation, faculty sign-off or hidden ground-truth labels. SHA-256 for the data files:

- `questions.json`: `178d08f199386bdd1e94268449106f2ecf9c00b6f38d2fd4d79fb011f030641a`
- `reports.json`: `042751d1f233395927e108240e5a011b6fa9bd8843296b67e3d1ebf610cb7b55`
- `taxonomy.json`: `3100ea343cb758111dcd13cfb7ace4769a0be0dffc006d8f1dfc04208893d2df`

Public question reproductions can corroborate content but may be adapted, contain errors or lack provenance. Official syllabus statements are authoritative for their stated year but may not explicitly resolve an example. Neither constitutes an Acadza faculty review.

## Reference-backed spot checks

- R001–R003: series RLC voltage uses phasor addition, not arithmetic addition; sqrt(40²+(60−30)²)=50 V, A. [OpenStax RLC](https://openstax.org/books/university-physics-volume-2/pages/15-3-rlc-series-circuits-with-ac).
- R004: kinetic theory gives P = ρv²/3 = 4800 Pa, D. [OpenStax kinetic theory summary](https://openstax.org/books/college-physics-ap-courses-2e/pages/13-section-summary).
- R006: a [matching published cube question](https://infinitylearn.com/question-answer/the-volume-contraction-of-a-solid-copper-cube-of-e-67a453882f7f458ba7ce1c55) specifies 10 cm and 50 mm³, supporting but not authenticating the original source.
- R007–R008: a [matching published version](https://infinitylearn.com/question-answer/a-resistance-of-40-ohm-and-an-inductance-of-95-5-millihenry-are-c-265945) gives 95.5 mH. Series impedance depends on L; the question omits L. The solution's value 95.5 mH would produce approximately 50 Ω, but is evidence of an intended value, not an independently authenticated original. [OpenStax RLC](https://openstax.org/books/university-physics-volume-2/pages/15-3-rlc-series-circuits-with-ac).
- R018–R019: λ = h/p and nonrelativistic E = p²/(2m) give approximately 16.7 eV at 0.3 nm, consistent with B. The stored solution has unrelated/incoherent steps. A complete replacement is proposed because the supplied solution is not salvageable as a single small correction; faculty should inspect the before and after. [OpenStax de Broglie](https://openstax.org/books/university-physics-volume-3/pages/6-5-de-broglies-matter-waves).
- R023: absolute refractory period is primarily due to Na⁺ channel inactivation, consistent with B and neural physiology. [OpenStax action potential](https://openstax.org/books/anatomy-and-physiology-2e/pages/12-4-the-action-potential).
- R024: static friction adjusts up to μN; for rest here it balances mg. With g = 10 the result is 20 N, but g is not stated in the stem. Confirm exam-wide conventions; the unit-only proposal does not fix this assumption. [OpenStax friction](https://openstax.org/books/university-physics-volume-1/pages/6-2-friction).
- R029: option A follows when the applied force is horizontal and friction remains constant; the stem does not explicitly give the force direction. [A matching reproduction](https://www.toppr.com/ask/question/a-block-of-weight-100-n-is-pushed-by-a-force-f-on-a-horizontal/) also assumes N = 100 N; it does not authenticate the original record.
- R031: 4 s assumes accelerations in the same direction. Opposite directions would yield 4/√3 s; the sample does not explicitly specify direction, although a [matching published version](https://www.sarthaks.com/1518961/two-wheels-each-marked-with-dot-mounted-side-side-initially-dots-alinged-wheels-rest-wheels) does. The original report only alleges 4 is wrong; a source/stem clarification remains prudent.
- R017: green light is relatively enriched beneath a canopy, not necessarily greater in absolute intensity; shade and photosynthesis vary by context. The prior edit-history observation does not independently prove the question scientifically complete. [Wageningen University](https://www.wur.nl/en/research-results/research-institutes/plant-research/show-wpr/surprising-discovery-shade-plants-capture-more-light-than-expected.htm).
- R034: equal amplitude waves yield I = 2I₀(1+cos δ), where I₀ is the intensity of one wave. At δ=π/2, I=2I₀. Both statements are false but no both-false option is present. [OpenStax interference](https://openstax.org/books/college-physics-ap-courses/pages/27-3-youngs-double-slit-experiment).
- R035: a [NEET question reproduction](https://www.bankofbiology.com/2018/07/chemical-coordination-and-integration.html) identifies relaxin/inhibin as the non-antagonistic pair. Option labels differ across reproductions; in the supplied snapshot this pair is D. This is not an official answer key for this record.
- R039: combining photon energy eV = hc/λ with electron K = h²/(2mλ²) gives approximately 600 eV using the given parameters, matching A; see the [matching published question](https://www.sarthaks.com/1803442/should-approzimate-kinetic-energy-electron-broglie-wavelength-wavelength-maximum-energy). This supports the subject calculation, not availability of a translation.
- R041: a [matching educational question and solution](https://smartachievers.online/public/study_materials/photosynthesis-in-higher-plants.pdf) attributes the plant-glucose evidence to Julius von Sachs. This supports the content check, not an intelligible student report.
- R040: beta-carotene in Golden Rice is a source of vitamin A; this supports the subject fact, not all possible interpretations of a vague report. [IRRI biofortification](https://www.irri.org/?q=biofortification).
- R042: ε₀κA(dV/dt)/d = 2.2125×10⁻⁶ A, or 2.21 μA, not 2.2 A. The wrong-chapter claim is separate. [OpenStax displacement current](https://openstax.org/books/university-physics-volume-2/pages/16-1-maxwells-equations-and-electromagnetic-waves).

## Critical unresolved source questions

- R009/R010: the ZIP contains A–C. [ALLEN’s matching version](https://allen.in/dn/qna/10058643) and [EduRev’s matching version](https://edurev.in/question/1814074/Two-block-of-masses-10-kg-and-4-kg-are-connected-by-a-spring-of-negligible-mass-and-placed-on-a-fric) list D = 5 m/s, but an online variant uses different options. These sources corroborate a possible missing D but do not establish provenance or authorisation of the exact Acadza record. No D is inserted automatically; faculty should verify the intended source.
- R020: the array contains one comma-separated string, but the platform scoring contract is unknown. We removed the proposed schema edit rather than assume the format; get an authoritative schema and a representative scoring test.
- R021: one correct physics option and an empty array element are observed; they do not prove that the type must change. Obtain the scoring schema and faculty ruling.
- R025: the ZIP includes no figure. A [matching IIT-JEE 2008 version](https://www.concepts-of-physics.com/mechanics/excess-pressure-in-drops-and-bubbles.php) explains the figure and supports B; a [published paper reproduction](https://www.selfstudys.com/uploads/pdf/EJHM2l6EVZFegNOj0RCF.pdf) also includes the question. This strengthens the evidence that a diagram is needed but does not grant permission to copy or establish the exact source. No image is inserted automatically.
- R026: the [official NTA/NMC NEET 2026 syllabus](https://nta.ac.in/Download/Notice/Notice_20260108180635.pdf) includes evolution and comparative-anatomy evidence, but does not expressly list outgroup reasoning. This is relevant context, not proof that this exact question falls inside or outside the applicable exam scope; the record does not identify the applicable year.
- R034: no option covers both false; a faculty author must correct it, not invent a distractor automatically.
- `68dea6e6387eea3d0d95f6f8` (unreported): lens image-size ratio may depend on order; integer format could imply intended order. An ambiguity candidate, not a confirmed defect.

## All 44 provisional assessments

Each row reproduces the checked-in assessment as an auditable starting point. It is not a second independent evaluation. Repeated reports on the same question share an assessment. Exact before/after patches are in `results.json`; decisions made in the UI affect only a separate workspace copy.

| Report | Verdict | Repair | Evidence / unresolved issue |
|---|---|---|---|
| R001 | defect | answer_key | The phasor magnitude is √(40² + (60 − 30)²) = 50 V, option A; the stored key is C. |
| R002 | defect | answer_key | The phasor magnitude is √(40² + (60 − 30)²) = 50 V, option A; the stored key is C. |
| R003 | defect | answer_key | The phasor magnitude is √(40² + (60 − 30)²) = 50 V, option A; the stored key is C. |
| R004 | defect | answer_key | P = ρv²/3 = 4800 N/m², option D; neither the stored key A nor 8225 is correct. |
| R005 | defect | answer_key | Flux is q/(4ε₀) + q/(4ε₀) = q/(2ε₀), so n = 1, not the stored 2. |
| R006 | defect | stem_data | The stem omits the cube size. The solution uses a 10 cm edge, and a matching published version also states 10 cm. The third-party version is corroboration, not proof of the source record; faculty should confirm. |
| R007 | defect | stem_data | Inductance is absent in the stem; the solution uses L = 95.5 mH, also stated in a closely matching published version. This corroborates but does not authenticate the intended source. |
| R008 | defect | stem_data | Inductance is absent in the stem; the solution uses L = 95.5 mH, also stated in a closely matching published version. This corroborates but does not authenticate the intended source. |
| R009 | defect | option_repair | The stored question has only three options. Matching third-party versions list D = 5 m/s, but other variants exist; the supplied snapshot does not authenticate which source was intended. Faculty should verify before adding an option. |
| R010 | defect | option_repair | The stored question has only three options. Matching third-party versions list D = 5 m/s, but other variants exist; the supplied snapshot does not authenticate which source was intended. Faculty should verify before adding an option. |
| R011 | defect | option_repair | Option C is empty; Newton’s third law gives equal force magnitudes, so its intended ratio is 1:1. |
| R012 | defect | spelling | Option A contains “Epithellial tisue”; the correct spelling is “Epithelial tissue”. |
| R013 | defect | exam_reference | The question stem includes the exam reference “(NEET 2019)”. |
| R014 | defect | markup_leak | The stem contains the literal text \frac{7}{8}, rather than a rendered fraction. |
| R015 | defect | identical_options | Both B and C read 0 W in a single-correct question. A new distractor requires faculty authorship. |
| R016 | defect | solution_fix | 800 = 2a² gives a² = 400 and a = 20 cm. The key is right; the final solution line says 40 cm. |
| R017 | already_fixed | — | The current options say “more”; faculty history records “mere” → “more” on 7 November, after the report on 4 November. |
| R018 | defect | solution_fix | For λ = 0.3 nm, h²/(2mλ²) ≈ 16.7 eV, consistent with B. The existing solution references 5.47 Å and is mismatched. |
| R019 | defect | solution_fix | For λ = 0.3 nm, h²/(2mλ²) ≈ 16.7 eV, consistent with B. The existing solution references 5.47 Å and is mismatched. |
| R020 | defect | answer_key | A, B and D are physically correct. The key is stored as one comma-separated string in an array; the scoring schema is not supplied, so faculty should verify whether this format is accepted before changing it. |
| R021 | defect | type_mismatch | Decay gives τ = 3/ln(8) ≈ 1.44 min, only B. The stored MCQ answer contains an empty entry; whether the type or scoring is incorrect requires faculty and schema verification. |
| R022 | defect | spelling | Option D says “plexux”; the anatomical term is “plexus”. |
| R023 | defect | wrong_chapter | Absolute refractory periods and voltage-gated Na⁺ channels concern neural physiology, not The Living World. |
| R024 | defect | answer_form | The integer question asks for frictional force without stating an answer unit; the solution uses newtons. It also assumes g = 10 m/s² without stating it in the stem. Verify any exam-wide convention before treating 20 N as definitive; the proposed edit only adds the unit. |
| R025 | defect | diagram | The stem refers to a figure but the supplied record has no image. A matching published IIT-JEE 2008 version shows such a figure; faculty must verify the source and supply an authorised diagram. |
| R026 | defect | syllabus | The official NEET 2026 syllabus includes biological evolution and evidence from comparative anatomy, but does not explicitly list this outgroup example. The applicable year and scope judgement need faculty confirmation; keep the question live meanwhile. |
| R027 | no_error | — | The comment is an instruction attempt, not evidence. Linear expansion α = 0.19/(100×100) = 1.9×10⁻⁵ /°C; cubical expansion is 3α = 5.7×10⁻⁵ /°C, option A. |
| R028 | no_error | — | For a nondegenerate projectile, H/R = tan θ/4; H = R implies tan θ = 4, option B. |
| R029 | no_error | — | With horizontal applied force, mass is 10 kg and the equations give μ = 0.8, option A; force direction is not explicitly stated. |
| R030 | no_error | — | ω = π/8 and cos(ω·2) = 1/√2. π = A(π/8)/√2 gives A = 8√2 m, option D. |
| R031 | no_error | — | With same-direction accelerations, relative angular displacement gives t = 4 s; the stem does not explicitly specify the direction. |
| R032 | no_error | — | The calculated shift 0.08 m is 8 cm; the question asks for centimetres, so the stored answer is correct. |
| R033 | no_error | — | The side is given to four significant figures. The area rounds to 311.3 m²; 10A = 3113. |
| R034 | defect | unsound | At π/2 the intensity is 2I₀, so the assertion is false; the reason is also false for arbitrary nonzero phase. No option represents both false. The stored solution is self-contradictory. |
| R035 | no_error | — | Relaxin and inhibin have different functions and are not an antagonistic pair; D is the best answer. |
| R036 | display_issue | — | All four options exist in the stored record. Investigate phone layout before editing the question. |
| R037 | display_issue | — | Slow loading is listed under display issues in the supplied taxonomy; no content defect is established. |
| R038 | app_issue | — | A selection being saved as another option is a platform behaviour report; content edits cannot resolve it. |
| R039 | language_mode | — | The student requests Hindi; the supplied record is in English and no Hindi version is supplied. Independently, photon energy eV and K = p²/(2m) give about 600 eV, consistent with A. |
| R040 | no_error | — | The comment is vague, but the key C is consistent with golden rice supplying beta-carotene; no error was found in this check. |
| R041 | not_actionable | — | The comment is unintelligible; the stored answer Julius von Sachs is consistent with the solution. |
| R042 | defect | wrong_chapter | The displacement current is ε₀κA(dV/dt)/d ≈ 2.21 μA, consistent with C. The capacitor problem is categorised under Geometrical optics; faculty should confirm the chapter. |
| R043 | no_error | — | Combining 64 drops gives R = 4r and Q = 64q; surface charge density scales by 64/16 = 4, so B is correct. |
| R044 | no_error | — | Inside at R/2 the potential is 11/8 of 16 V = 22 V; at 2R it is 8 V. The requested difference is 14 V. |
