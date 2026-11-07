(*---
description: "A proof that ends without a QED step is rejected: Unexpected end of (sub)proof before QED step."
ref: src/proof/p_parser.ml#to_steps
mode: obligations
outcome: rejected
---*)
---- MODULE missing_qed ----
THEOREM TRUE
<1>1. TRUE OBVIOUS
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./missing_qed.tla", line 9, character 19

    Unexpected end of (sub)proof at level 1 before QED step

    File "./missing_qed.tla", line 9, character 19:
    Error: Unexpected end of (sub)proof at level 1 before QED step
     tlapm ending abnormally with Failure("Proof.Parser")
---*)
