(*---
description: A subproof must use a deeper level than its step, so a <1> step under a <2> step makes the parser backtrack to the theorem, and the first step is reported as an extra step.
ref: src/proof/p_parser.ml#toplevel
mode: obligations
outcome: rejected
---*)
---- MODULE shallower_subproof_level ----
THEOREM TRUE
<2>1. TRUE
  <1>1. TRUE OBVIOUS
  <1> QED OBVIOUS
<2> QED OBVIOUS
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./shallower_subproof_level.tla", line 9, characters 1-10

    extra step(s) after finished proof

    File "./shallower_subproof_level.tla", line 9, characters 1-10:
    Error: extra step(s) after finished proof
     tlapm ending abnormally with Failure("Proof.Parser.toplevel")
---*)
