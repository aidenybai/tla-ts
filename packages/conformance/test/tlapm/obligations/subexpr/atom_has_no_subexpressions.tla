(*---
description: A selector on an identifier fails because it has no subexpressions.
ref: src/expr/e_deref.ml#deref_num
mode: obligations
outcome: rejected
---*)
---- MODULE atom_has_no_subexpressions ----
CONSTANT A
Op == A
THEOREM Op!1
  OBVIOUS
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./atom_has_no_subexpressions.tla", line 10, characters 9-12

    Expression has no subexpressions

    File "./atom_has_no_subexpressions.tla", line 10, characters 9-12:
    Error: Expression has no subexpressions
     tlapm ending abnormally with Failure("Expr.Deref.deref_num")
---*)
