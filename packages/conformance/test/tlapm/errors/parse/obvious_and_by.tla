(*---
description: A leaf proof is either OBVIOUS or BY, so OBVIOUS after a BY is left over and the proof is rejected.
ref: src/proof/p_parser.ml#toplevel
mode: obligations
outcome: rejected
---*)
---- MODULE obvious_and_by ----
THEOREM TRUE
<1>1. TRUE OBVIOUS
<1> QED BY <1>1 OBVIOUS
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./obvious_and_by.tla", line 10, characters 17-23

    extra step(s) after finished proof

    File "./obvious_and_by.tla", line 10, characters 17-23:
    Error: extra step(s) after finished proof
     tlapm ending abnormally with Failure("Proof.Parser.toplevel")
---*)
