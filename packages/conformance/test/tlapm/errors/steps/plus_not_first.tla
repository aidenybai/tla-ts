(*---
description: <+> starts a deeper level, so it is rejected on a step that does not begin a subproof.
ref: src/proof/p_parser.ml#to_steps
mode: obligations
outcome: rejected
---*)
---- MODULE plus_not_first ----
THEOREM TRUE
<1>1. TRUE OBVIOUS
<+> QED OBVIOUS
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./plus_not_first.tla", line 10, characters 1-7

    <+> used but no subproof expected

    File "./plus_not_first.tla", line 10, characters 1-7:
    Error: <+> used but no subproof expected
     tlapm ending abnormally with Failure("Proof.Parser")
---*)
