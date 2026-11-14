(*---
description: Op!3 on a binary operator cannot be resolved, so the module is rejected.
ref: src/expr/e_deref.ml#deref
mode: obligations
outcome: rejected
---*)
---- MODULE number_out_of_range ----
CONSTANT A, B
Op == A /\ B
THEOREM Op!3
  OBVIOUS
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./number_out_of_range.tla", line 10, characters 9-12

    Cannot resolve !3

    File "./number_out_of_range.tla", line 10, characters 9-12:
    Error: Cannot resolve !3
     tlapm ending abnormally with Failure("Expr.Deref.deref_num")
---*)
