(*---
description: Op!@ on a body that binds nothing is rejected.
ref: src/expr/e_deref.ml#deref_at
mode: obligations
outcome: rejected
---*)
---- MODULE at_non_binding ----
CONSTANT A, B
Op == A /\ B
THEOREM Op!@
  OBVIOUS
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./at_non_binding.tla", line 10, characters 9-12

    Cannot abstract over bound variables in a non-binding expression

    File "./at_non_binding.tla", line 10, characters 9-12:
    Error: Cannot abstract over bound variables in a non-binding expression
     tlapm ending abnormally with Failure("Expr.Deref.deref_at")
---*)
