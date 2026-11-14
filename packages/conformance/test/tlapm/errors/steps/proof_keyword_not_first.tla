(*---
description: The PROOF keyword may only precede the first step of a subproof, so PROOF before a later step is rejected.
ref: src/proof/p_parser.ml#to_steps
mode: obligations
outcome: rejected
---*)
---- MODULE proof_keyword_not_first ----
THEOREM TRUE
<1>1. TRUE OBVIOUS
PROOF <1> QED OBVIOUS
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./proof_keyword_not_first.tla", line 10, characters 7-13

    PROOF keyword found in step that does not begin subproof

    File "./proof_keyword_not_first.tla", line 10, characters 7-13:
    Error: PROOF keyword found in step that does not begin subproof
     tlapm ending abnormally with Failure("Proof.Parser")
---*)
