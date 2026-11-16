(*---
description: A step fact that is an atom has no subexpressions, so <1>1!2 is rejected.
ref: src/expr/e_deref.ml#resolve_bang
mode: obligations
outcome: rejected
---*)
---- MODULE subexpression_of_atomic_step ----
THEOREM TRUE
<1>1. TRUE OBVIOUS
<1> QED BY <1>1!2
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./subexpression_of_atomic_step.tla", line 10, characters 12-17

    Expression has no subexpressions

    File "./subexpression_of_atomic_step.tla", line 10, characters 12-17:
    Error: Expression has no subexpressions
     tlapm ending abnormally with Failure("Expr.Deref.deref_num")
---*)
