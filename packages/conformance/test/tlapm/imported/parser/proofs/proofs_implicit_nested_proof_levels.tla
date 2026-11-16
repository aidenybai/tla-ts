(*---
description: The syntax corpus case "Implicit Nested Proof Levels" in proofs.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/proofs.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: incomplete
---*)
---- MODULE proofs_implicit_nested_proof_levels ----
COROLLARY TRUE
<*> 1
  <+> 2
    <+> 3
      <+> 4
      <*> QED
    <*> QED
  <*> 5
    <+> 6
    <*> QED
  <*> QED
<*> 7
<*> QED
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    @type: obligationsnumber
    @count: 0

    Missing proof at File "./proofs_implicit_nested_proof_levels.tla", line 15, characters 7-11
    Missing proof at File "./proofs_implicit_nested_proof_levels.tla", line 16, characters 7-13
    Missing proof at File "./proofs_implicit_nested_proof_levels.tla", line 17, characters 5-11
    Missing proof at File "./proofs_implicit_nested_proof_levels.tla", line 19, characters 5-9
    Missing proof at File "./proofs_implicit_nested_proof_levels.tla", line 20, characters 5-11
    Missing proof at File "./proofs_implicit_nested_proof_levels.tla", line 21, characters 3-9
    Missing proof at File "./proofs_implicit_nested_proof_levels.tla", line 22, characters 1-5
    Missing proof at File "./proofs_implicit_nested_proof_levels.tla", line 23, characters 1-7
    File "./proofs_implicit_nested_proof_levels.tla", line 10, character 1 to line 24, character 4:
    [ERROR]: Proof incomplete in module "proofs_implicit_nested_proof_levels": 8 missing, 0 omitted proof step(s).
---*)
