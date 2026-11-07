(*---
description: Op!(e) on a quantifier that binds two variables is an arity mismatch, and the module is rejected.
ref: src/expr/e_deref.ml#deref_inst
mode: obligations
outcome: rejected
---*)
---- MODULE instantiate_arity_mismatch ----
CONSTANT P(_, _)
Op == \E x, y : P(x, y)
THEOREM Op!(1)
  OBVIOUS
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./instantiate_arity_mismatch.tla", line 10, characters 9-14

    Arity mismatch in subexpression instance.@
    Expected 2 arguments, but found only 1.

    File "./instantiate_arity_mismatch.tla", line 10, characters 9-14:
    Error: Arity mismatch in subexpression instance.
    Expected 2 arguments, but found only 1.
     tlapm ending abnormally with Failure("Expr.Deref.deref_inst")
---*)
