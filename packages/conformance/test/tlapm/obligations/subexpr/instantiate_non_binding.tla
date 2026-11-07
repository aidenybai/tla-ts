(*---
description: Op!(e) on a body that binds nothing cannot be instantiated, and the module is rejected.
ref: src/expr/e_deref.ml#deref_inst
mode: obligations
outcome: rejected
---*)
---- MODULE instantiate_non_binding ----
CONSTANT A, B
Op == A /\ B
THEOREM Op!(1)
  OBVIOUS
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./instantiate_non_binding.tla", line 10, characters 9-14

    Cannot instantiate non-binding expression

    File "./instantiate_non_binding.tla", line 10, characters 9-14:
    Error: Cannot instantiate non-binding expression
     tlapm ending abnormally with Failure("Expr.Deref.deref_inst")
---*)
