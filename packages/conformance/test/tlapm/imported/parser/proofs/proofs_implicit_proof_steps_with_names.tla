(*---
description: The syntax corpus case "Implicit Proof Steps With Names" in proofs.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/proofs.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE proofs_implicit_proof_steps_with_names ----
THEOREM TRUE
<*>abc 1
<*>def QED
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./proofs_implicit_proof_steps_with_names.tla", line 12, character 7

    Unexpected end of (sub)proof at level 0 before QED step

    File "./proofs_implicit_proof_steps_with_names.tla", line 12, character 7:
    Error: Unexpected end of (sub)proof at level 0 before QED step
     tlapm ending abnormally with Failure("Proof.Parser")
---*)
