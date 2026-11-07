(*---
description: The syntax corpus case "Proof with Plus Step" in proofs.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/proofs.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: incomplete
---*)
---- MODULE proofs_proof_with_plus_step ----
COROLLARY TRUE
<+> 1
<0> 2
<*> 3
<0> 4
<*> 5
<0> QED
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    @type: obligationsnumber
    @count: 0

    Missing proof at File "./proofs_proof_with_plus_step.tla", line 12, characters 1-5
    Missing proof at File "./proofs_proof_with_plus_step.tla", line 13, characters 1-5
    Missing proof at File "./proofs_proof_with_plus_step.tla", line 14, characters 1-5
    Missing proof at File "./proofs_proof_with_plus_step.tla", line 15, characters 1-5
    Missing proof at File "./proofs_proof_with_plus_step.tla", line 16, characters 1-5
    Missing proof at File "./proofs_proof_with_plus_step.tla", line 17, characters 1-7
    File "./proofs_proof_with_plus_step.tla", line 10, character 1 to line 18, character 4:
    [ERROR]: Proof incomplete in module "proofs_proof_with_plus_step": 6 missing, 0 omitted proof step(s).
---*)
