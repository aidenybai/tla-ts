(*---
description: The syntax corpus case "Plus Proof Step With Name" in proofs.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/proofs.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE proofs_plus_proof_step_with_name ----
THEOREM TRUE
<1>abc 1
  <+>def 2
  <2>ghi QED
<1>jkl QED
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./proofs_plus_proof_step_with_name.tla", line 13, character 9

    Unexpected end of (sub)proof at level 2 before QED step

    File "./proofs_plus_proof_step_with_name.tla", line 13, character 9:
    Error: Unexpected end of (sub)proof at level 2 before QED step
     tlapm ending abnormally with Failure("Proof.Parser")
---*)
