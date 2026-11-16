(*---
description: A step's proof is either a leaf or a list of steps, so a BY after the steps of a subproof is rejected.
ref: src/proof/p_parser.ml#to_steps
mode: obligations
outcome: rejected
---*)
---- MODULE leaf_after_steps ----
THEOREM TRUE
<1>1. TRUE
  <2> QED OBVIOUS
  BY TRUE
<1> QED OBVIOUS
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./leaf_after_steps.tla", line 11, characters 3-4

    Expecting a proof step but found a BY leaf proof

    File "./leaf_after_steps.tla", line 11, characters 3-4:
    Error: Expecting a proof step but found a BY leaf proof
     tlapm ending abnormally with Failure("Proof.Parser")
---*)
