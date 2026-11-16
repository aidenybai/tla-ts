(*---
description: A step after the QED of a subproof, at the subproof's level, is an extra step after a finished proof.
ref: src/proof/p_parser.ml#toplevel
mode: obligations
outcome: rejected
---*)
---- MODULE step_after_inner_qed ----
THEOREM TRUE
<1> QED
  <2> QED OBVIOUS
  <2>1. TRUE OBVIOUS
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./step_after_inner_qed.tla", line 11, characters 3-12

    extra step(s) after finished proof

    File "./step_after_inner_qed.tla", line 11, characters 3-12:
    Error: extra step(s) after finished proof
     tlapm ending abnormally with Failure("Proof.Parser.toplevel")
---*)
