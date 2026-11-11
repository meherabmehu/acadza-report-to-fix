"""Merge a real validated LLM batch with explicit conservative expert-unverified overrides.
The input model batch is retained unchanged; the output is reproducible, not raw LLM output.
"""
import json
import sys
from pathlib import Path
p=Path(__file__).resolve().parent.parent
load=lambda f:json.loads((p/f).read_text())
raw=load('data/results-qwen-batch.json'); curated=load('data/curated-baseline.json'); reports=load('data/reports.json')
base={r['reportId']:r for r in curated}; source={r['reportId']:r for r in reports}
if len(raw)!=44 or len(base)!=44 or set(base)!=set(source) or {x['reportId'] for x in raw}!=set(source):raise ValueError('Exactly one row per supplied report is required')
out=[]
for x in raw:
 b=base[x['reportId']]
 if x['questionId']!=b['questionId'] or x['questionId']!=source[x['reportId']]['questionId']:raise ValueError('Question identity mismatch')
 # Defects and disagreements require careful subject review; retain checked-in
 # conservative proposals rather than publish known wrong AI edits. R044 has an
 # erroneous intermediate formula in the model evidence even though its answer matches.
 # R028 has an incomplete division assumption; R029/R031 disclose direction assumptions; R039 adds a computed check.
 if b['verdict']=='defect' or (x['verdict'],x['repair'])!=(b['verdict'],b['repair']) or x['reportId'] in ('R028','R029','R031','R039','R044'):
  row=b.copy()
 else:
  row=x.copy()
  # Preserve checked case-specific drafts; these remain previews, not sent messages.
  row['student_reply']=b['student_reply']
 out.append(row)
target=Path(sys.argv[1]) if len(sys.argv)>1 else p/'results.json'
target.write_text(json.dumps(out,indent=2,ensure_ascii=False)+'\n')
print(f'Wrote {len(out)} batch-derived assessments with transparent review overrides.')
