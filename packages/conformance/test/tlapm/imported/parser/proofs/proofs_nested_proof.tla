(*---
description: The syntax corpus case "Nested Proof" in proofs.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/proofs.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: incomplete
---*)
---- MODULE proofs_nested_proof ----
THEOREM TRUE
PROOF
<*> 1
<0> 2
  <+> 3
  <1> 4
  <*> QED
<0> 5
<*> 6
<0> QED
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    @type: obligationsnumber
    @count: 0

    Missing proof at File "./proofs_nested_proof.tla", line 13, characters 1-5
    Missing proof at File "./proofs_nested_proof.tla", line 15, characters 3-7
    Missing proof at File "./proofs_nested_proof.tla", line 16, characters 3-7
    Missing proof at File "./proofs_nested_proof.tla", line 17, characters 3-9
    Missing proof at File "./proofs_nested_proof.tla", line 18, characters 1-5
    Missing proof at File "./proofs_nested_proof.tla", line 19, characters 1-5
    Missing proof at File "./proofs_nested_proof.tla", line 20, characters 1-7
    File "./proofs_nested_proof.tla", line 10, character 1 to line 21, character 4:
    [ERROR]: Proof incomplete in module "proofs_nested_proof": 7 missing, 0 omitted proof step(s).
---*)
