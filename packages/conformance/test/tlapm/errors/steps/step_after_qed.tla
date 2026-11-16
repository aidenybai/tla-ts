(*---
description: A step after the QED of the same level is an extra step after a finished proof.
ref: src/proof/p_parser.ml#toplevel
mode: obligations
outcome: rejected
---*)
---- MODULE step_after_qed ----
THEOREM TRUE
<1> QED BY <1>1
<1>1. TRUE OBVIOUS
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./step_after_qed.tla", line 10, characters 1-10

    extra step(s) after finished proof

    File "./step_after_qed.tla", line 10, characters 1-10:
    Error: extra step(s) after finished proof
     tlapm ending abnormally with Failure("Proof.Parser.toplevel")
---*)
