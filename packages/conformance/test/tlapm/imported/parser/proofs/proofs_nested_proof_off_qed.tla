(*---
description: The syntax corpus case "Nested Proof Off QED" in proofs.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/proofs.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: incomplete
---*)
---- MODULE proofs_nested_proof_off_qed ----
PROPOSITION TRUE
PROOF
<*> 1
  PROOF
  <+> 2
  <1> QED
    PROOF
    <*> 3
      <1000> 4
      <*> QED
    <2> QED
<0> QED
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    @type: obligationsnumber
    @count: 0

    Missing proof at File "./proofs_nested_proof_off_qed.tla", line 15, characters 3-7
    Missing proof at File "./proofs_nested_proof_off_qed.tla", line 19, characters 7-14
    Missing proof at File "./proofs_nested_proof_off_qed.tla", line 20, characters 7-13
    Missing proof at File "./proofs_nested_proof_off_qed.tla", line 21, characters 5-11
    Missing proof at File "./proofs_nested_proof_off_qed.tla", line 22, characters 1-7
    File "./proofs_nested_proof_off_qed.tla", line 10, character 1 to line 23, character 4:
    [ERROR]: Proof incomplete in module "proofs_nested_proof_off_qed": 5 missing, 0 omitted proof step(s).
---*)
