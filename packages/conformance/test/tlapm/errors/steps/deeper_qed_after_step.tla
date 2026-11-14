(*---
description: A deeper step after a step that has its own leaf proof does not begin a subproof, so the parser backtracks to the theorem, whose proof becomes an implicit omission, and the first step is reported as an extra step.
ref: src/proof/p_parser.ml#toplevel
mode: obligations
outcome: rejected
---*)
---- MODULE deeper_qed_after_step ----
THEOREM TRUE
<1>1. TRUE OBVIOUS
<2> QED OBVIOUS
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./deeper_qed_after_step.tla", line 9, characters 1-10

    extra step(s) after finished proof

    File "./deeper_qed_after_step.tla", line 9, characters 1-10:
    Error: extra step(s) after finished proof
     tlapm ending abnormally with Failure("Proof.Parser.toplevel")
---*)
