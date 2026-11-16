(*---
description: Op!d does not name the definition d of a LET in Op's body, because a selector that follows the operator's name directly is looked up as a label, so the module is rejected.
ref: src/expr/e_deref.ml#deref
mode: obligations
outcome: rejected
---*)
---- MODULE let_definition ----
CONSTANT c
Op == LET d == c IN d = c
THEOREM Op!d = c
  OBVIOUS
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./let_definition.tla", line 10, characters 9-12

    Could not resolve subexpression reference

    File "./let_definition.tla", line 10, characters 9-12:
    Error: Could not find label d
    File "./let_definition.tla", line 10, characters 9-12:
    Error: Could not resolve subexpression reference
     tlapm ending abnormally with Failure("Expr.Anon: 2")
---*)
