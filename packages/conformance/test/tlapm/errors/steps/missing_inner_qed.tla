(*---
description: When a subproof returns to the outer level without its own QED, the parser backtracks to the theorem, whose proof becomes an implicit omission, so the first step is reported as an extra step after a finished proof.
ref: src/proof/p_parser.ml#to_steps
mode: obligations
outcome: rejected
---*)
---- MODULE missing_inner_qed ----
THEOREM TRUE
<1>1. TRUE
  <2>1. TRUE OBVIOUS
<1> QED OBVIOUS
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./missing_inner_qed.tla", line 9, characters 1-10

    extra step(s) after finished proof

    File "./missing_inner_qed.tla", line 9, characters 1-10:
    Error: extra step(s) after finished proof
     tlapm ending abnormally with Failure("Proof.Parser.toplevel")
---*)
