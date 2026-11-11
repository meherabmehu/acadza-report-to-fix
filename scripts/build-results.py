import json
from pathlib import Path
p=Path(__file__).resolve().parent.parent
questions=json.loads((p/'data/questions.json').read_text()); reports=json.loads((p/'data/reports.json').read_text()); by={q['_id']:q for q in questions}
# Curated assessments checked against the provided snapshot with AI assistance, not faculty-verified ground truth.
D={
'R001':('defect','answer_key','The phasor magnitude is √(40² + (60 − 30)²) = 50 V, option A; the stored key is C.'),
'R002':('defect','answer_key','The phasor magnitude is √(40² + (60 − 30)²) = 50 V, option A; the stored key is C.'),
'R003':('defect','answer_key','The phasor magnitude is √(40² + (60 − 30)²) = 50 V, option A; the stored key is C.'),
'R004':('defect','answer_key','P = ρv²/3 = 4800 N/m², option D; neither the stored key A nor 8225 is correct.'),
'R005':('defect','answer_key','Flux is q/(4ε₀) + q/(4ε₀) = q/(2ε₀), so n = 1, not the stored 2.'),
'R006':('defect','stem_data','The stem omits the cube size. The solution uses a 10 cm edge, and a matching published version also states 10 cm. The third-party version is corroboration, not proof of the source record; faculty should confirm.'),
'R007':('defect','stem_data','Inductance is absent in the stem; the solution uses L = 95.5 mH, also stated in a closely matching published version. This corroborates but does not authenticate the intended source.'),
'R008':('defect','stem_data','Inductance is absent in the stem; the solution uses L = 95.5 mH, also stated in a closely matching published version. This corroborates but does not authenticate the intended source.'),
'R009':('defect','option_repair','The stored question has only three options. Matching third-party versions list D = 5 m/s, but other variants exist; the supplied snapshot does not authenticate which source was intended. Faculty should verify before adding an option.'),
'R010':('defect','option_repair','The stored question has only three options. Matching third-party versions list D = 5 m/s, but other variants exist; the supplied snapshot does not authenticate which source was intended. Faculty should verify before adding an option.'),
'R011':('defect','option_repair','Option C is empty; Newton’s third law gives equal force magnitudes, so its intended ratio is 1:1.'),
'R012':('defect','spelling','Option A contains “Epithellial tisue”; the correct spelling is “Epithelial tissue”.'),
'R013':('defect','exam_reference','The question stem includes the exam reference “(NEET 2019)”.'),
'R014':('defect','markup_leak','The stem contains the literal text \\frac{7}{8}, rather than a rendered fraction.'),
'R015':('defect','identical_options','Both B and C read 0 W in a single-correct question. A new distractor requires faculty authorship.'),
'R016':('defect','solution_fix','800 = 2a² gives a² = 400 and a = 20 cm. The key is right; the final solution line says 40 cm.'),
'R017':('already_fixed',None,'The current options say “more”; faculty history records “mere” → “more” on 7 November, after the report on 4 November.'),
'R018':('defect','solution_fix','For λ = 0.3 nm, h²/(2mλ²) ≈ 16.7 eV, consistent with B. The existing solution references 5.47 Å and is mismatched.'),
'R019':('defect','solution_fix','For λ = 0.3 nm, h²/(2mλ²) ≈ 16.7 eV, consistent with B. The existing solution references 5.47 Å and is mismatched.'),
'R020':('defect','answer_key','A, B and D are physically correct. The key is stored as one comma-separated string in an array; the scoring schema is not supplied, so faculty should verify whether this format is accepted before changing it.'),
'R021':('defect','type_mismatch','Decay gives τ = 3/ln(8) ≈ 1.44 min, only B. The stored MCQ answer contains an empty entry; whether the type or scoring is incorrect requires faculty and schema verification.'),
'R022':('defect','spelling','Option D says “plexux”; the anatomical term is “plexus”.'),
'R023':('defect','wrong_chapter','Absolute refractory periods and voltage-gated Na⁺ channels concern neural physiology, not The Living World.'),
'R024':('defect','answer_form','The integer question asks for frictional force without stating an answer unit; the solution uses newtons. It also assumes g = 10 m/s² without stating it in the stem. Verify any exam-wide convention before treating 20 N as definitive; the proposed edit only adds the unit.'),
'R025':('defect','diagram','The stem refers to a figure but the supplied record has no image. A matching published IIT-JEE 2008 version shows such a figure; faculty must verify the source and supply an authorised diagram.'),
'R026':('defect','syllabus','The official NEET 2026 syllabus includes biological evolution and evidence from comparative anatomy, but does not explicitly list this outgroup example. The applicable year and scope judgement need faculty confirmation; keep the question live meanwhile.'),
'R027':('no_error',None,'The comment is an instruction attempt, not evidence. Linear expansion α = 0.19/(100×100) = 1.9×10⁻⁵ /°C; cubical expansion is 3α = 5.7×10⁻⁵ /°C, option A.'),
'R028':('no_error',None,'For a nondegenerate projectile, H/R = tan θ/4; H = R implies tan θ = 4, option B.'),
'R029':('no_error',None,'Assuming the applied force is horizontal and kinetic friction is constant, mass is 10 kg. F − 100μ = 10 and 2F − 100μ = 100 give μ = 0.8, option A. The stem does not explicitly state the force direction, so the calculation is conditional on that convention.'),
'R030':('no_error',None,'ω = π/8 and cos(ω·2) = 1/√2. π = A(π/8)/√2 gives A = 8√2 m, option D.'),
'R031':('no_error',None,'If both angular accelerations are in the same direction, relative displacement is ½(π/2 − π/4)t² = 2π, giving t = 4 s. The supplied stem does not explicitly state the direction; opposite directions would give 4/√3 s. A matching published version specifies the same direction, but does not establish the original source. Confirm the intended convention.'),
'R032':('no_error',None,'The calculated shift 0.08 m is 8 cm; the question asks for centimetres, so the stored answer is correct.'),
'R033':('no_error',None,'The side is given to four significant figures. The area rounds to 311.3 m²; 10A = 3113.'),
'R034':('defect','unsound','At π/2 the intensity is 2I₀, so the assertion is false; the reason is also false for arbitrary nonzero phase. No option represents both false. The stored solution is self-contradictory.'),
'R035':('no_error',None,'Relaxin and inhibin have different functions and are not an antagonistic pair; D is the best answer.'),
'R036':('display_issue',None,'All four options exist in the stored record. Investigate phone layout before editing the question.'),
'R037':('display_issue',None,'Slow loading is listed under display issues in the supplied taxonomy; no content defect is established.'),
'R038':('app_issue',None,'A selection being saved as another option is a platform behaviour report; content edits cannot resolve it.'),
'R039':('language_mode',None,'The student requests Hindi; the supplied record is in English and no Hindi version is supplied. Independently, photon energy eV and K = p²/(2m) give about 600 eV, consistent with A.'),
'R040':('no_error',None,'The comment is vague, but the key C is consistent with golden rice supplying beta-carotene; no error was found in this check.'),
'R041':('not_actionable',None,'The comment is unintelligible; the stored answer Julius von Sachs is consistent with the solution.'),
'R042':('defect','wrong_chapter','The displacement current is ε₀κA(dV/dt)/d ≈ 2.21 μA, consistent with C. The capacitor problem is categorised under Geometrical optics; faculty should confirm the chapter.'),
'R043':('no_error',None,'Combining 64 drops gives R = 4r and Q = 64q; surface charge density scales by 64/16 = 4, so B is correct.'),
'R044':('no_error',None,'Inside at R/2 the potential is 11/8 of 16 V = 22 V; at 2R it is 8 V. The requested difference is 14 V.'),
}
# Student-facing drafts: concise, specific and honest about the review state.
# These are previews only; no message is sent by this application.
replies={
'R001':'Thanks for checking the voltage. The calculation suggests 50 V (option A), while the stored key says C; faculty should review the key before any change.',
'R004':'Thanks for checking the pressure. Using the given density and speed gives 4800 N/m² (option D); the key needs faculty review.',
'R005':'Thanks for sharing your calculation. The flux gives n = 1, while the stored key says 2; faculty will need to review the mismatch.',
'R006':'Thanks for noticing the missing cube size. The solution uses a 10 cm edge, but faculty should confirm the intended value before updating the question.',
'R007':'Thanks for noticing that the inductance is missing. The solution uses 95.5 mH, but the intended value needs faculty confirmation before any change.',
'R009':'Thanks for flagging the options. The stored record has three choices; matching published versions have a fourth, but faculty should check the intended source before adding one.',
'R011':'Thanks for catching the blank option. The two force magnitudes are equal, suggesting a 1:1 ratio; faculty should check the proposed option before it is changed.',
'R012':'Thanks for catching the spelling mistake in option A. It has been flagged for faculty review before any correction.',
'R013':'Thanks for flagging the exam reference in the question. Faculty can review whether the tag should be removed.',
'R014':'Thanks for flagging the fraction display. The stored text contains a raw LaTeX fraction, so the proposed rendering correction needs review.',
'R015':'Thanks for noticing the duplicate options. Faculty need to review and author a distinct choice; we have not invented one.',
'R016':'Thanks for catching the solution mismatch. The calculation gives a side length of 20 cm; the incorrect final line needs faculty review.',
'R017':'Thanks for flagging the spelling. The current question already shows the corrected wording, so no further change is needed for this report.',
'R018':'Thanks for checking the solution. The key B is consistent with about 16.7 eV, but the intermediate solution text appears mismatched and needs faculty review.',
'R020':'Thanks for flagging the grading issue. A, B and D appear correct, but the stored answer format and scoring rules need faculty investigation before any change.',
'R021':'Thanks for flagging this question. The calculation gives option B, but the empty answer entry and question type need review against the platform’s scoring rules.',
'R022':'Thanks for noticing the spelling mistake in option D. The proposed correction needs faculty review before it is applied.',
'R023':'Thanks for noticing the chapter mismatch. This is a nervous-system topic; faculty should confirm the appropriate chapter.',
'R024':'Thanks for spotting the missing unit. The proposed wording adds newtons, and faculty should also check the gravitational acceleration assumed in the solution.',
'R025':'Thanks for reporting the missing figure. Faculty need to check the original source and provide the correct diagram.',
'R026':'Thanks for raising the syllabus concern. Faculty should check the applicable exam syllabus and year before making a decision.',
'R027':'Thanks for checking the expansion calculation. The linear coefficient is 1.9 × 10⁻⁵ per °C, so the cubical coefficient is 5.7 × 10⁻⁵ per °C, option A.',
'R028':'Thanks for checking the projectile calculation. Setting the range equal to the maximum height gives tan θ = 4, which matches option B.',
'R029':'Thanks for checking the friction calculation. Assuming the force is horizontal, solving the two force equations gives μ = 0.8, matching option A. The force direction should be confirmed.',
'R030':'Thanks for checking the motion. Using the given period and velocity gives an amplitude of 8√2 m, which matches option D.',
'R031':'Thanks for checking the wheel motion. If both wheels accelerate in the same direction, the first full relative rotation takes 4 seconds, matching the stored answer. The direction should be confirmed.',
'R032':'Thanks for checking the units. The shift is 0.08 m, which is 8 cm, so the stored answer matches the requested unit.',
'R033':'Thanks for checking the rounding. The area is 311.3 m² to four significant figures, so 10A is 3113.',
'R034':'Thanks for checking the assertion and reason. Both appear false, but no option covers that combination; faculty need to review the question.',
'R035':'Thanks for checking the hormone pairs. Relaxin and inhibin have different functions rather than opposing effects, so D is the best fit.',
'R036':'Thanks for letting us know. The stored record contains the options, so the team should investigate how they appear on your device.',
'R037':'Thanks for reporting the slow load. The team should investigate the display performance; the question itself has not been changed.',
'R038':'Thanks for reporting the selection problem. The team should investigate how the app records your answer; no question content has been changed.',
'R039':'Thanks for the suggestion. A Hindi version would need to be provided before this question can be available in Hindi.',
'R040':'Thanks for checking. Golden rice contains beta-carotene, a vitamin A precursor, so the stored key C is consistent with the question.',
'R041':'Thanks for reporting this. Could you tell us which part of the question seems wrong so the team can investigate?',
'R042':'Thanks for noticing the chapter mismatch. The calculation gives about 2.2 μA, matching C; faculty should confirm the appropriate chapter.',
'R043':'Thanks for checking the drop sizes. The combined drop has four times the surface charge density of a small drop, so the ratio is 4:1 (B).',
'R044':'Thanks for checking the potentials. The potential at P is 22 V and at S is 8 V, so the requested difference is 14 V.',
}
for duplicate,primary in {'R002':'R001','R003':'R001','R008':'R007','R010':'R009','R019':'R018'}.items(): replies[duplicate]=replies[primary]

# Exact substring operations; where source cannot be recovered leave edit null.
edits={
'R001':('answer','C','A'),'R002':('answer','C','A'),'R003':('answer','C','A'),
'R004':('answer','A','D'),'R005':('answer','2','1'),
'R006':('question','a solid copper cube,','a solid copper cube of side 10 cm,'),
'R007':('question','an inductance are connected','an inductance of 95.5 mH are connected'),
'R008':('question','an inductance are connected','an inductance of 95.5 mH are connected'),
'R011':('question','(C) <br />','(C) 1 : 1<br />'),
'R012':('question','Epithellial tisue','Epithelial tissue'),
'R013':('question','(NEET 2019) ',''),
'R014':('question',r'\frac{7}{8}','<math xmlns="http://www.w3.org/1998/Math/MathML"><mfrac><mn>7</mn><mn>8</mn></mfrac></math>'),
'R016':('solution','a = 40 cm','a = 20 cm'),
'R022':('question','plexux','plexus'),
'R024':('question','Then the frictional force is equal to','Then the frictional force (in N) is equal to'),
}
bad_solution=by['612151a6a34397610a9a2e58']['scq']['solution']
for rid in ('R018','R019'):
 edits[rid]=('solution',bad_solution,'<p>For an electron, E = h²/(2mλ²). With λ = 0.3 nm, E ≈ 16.7 eV, so the closest option is B (16.8 eV).</p>')
# Recover exact blank option markup before proposing it.
q=by['68e872546e45ba37dcc16bc0']['scq']['question']; idx=q.find('(C)'); print('R011 snippet:',q[idx:idx+300])
rows=[]
for r in reports:
 v,k,e=D[r['reportId']]; edit=None
 if r['reportId'] in edits:
  f,a,b=edits[r['reportId']]; content=by[r['questionId']][by[r['questionId']]['questionType']][f]
  assert (content==a if f=='answer' else content.count(a)==1),r['reportId']
  edit={'field':f,'find':a,'replace':b}
 route='auto_apply' if r['reportId'] in ('R012','R022') else ('faculty_review' if v=='defect' else 'no_change')
 reply=replies[r['reportId']]
 rows.append(dict(reportId=r['reportId'],questionId=r['questionId'],verdict=v,repair=k,edit=edit,route=route,confidence=0.9 if edit else 0.78,evidence=e,student_reply=reply))
(p/'data/curated-baseline.json').write_text(json.dumps(rows,indent=2,ensure_ascii=False)+'\n')
