(*---
description: Op!e for a LET without a definition e is rejected.
ref: src/expr/e_deref.ml#deref_letop
mode: obligations
outcome: rejected
---*)
---- MODULE let_definition_missing ----
CONSTANT c
Op == LET d == c IN d = c
THEOREM Op!e = c
  OBVIOUS
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./let_definition_missing.tla", line 10, characters 9-12

    Could not resolve subexpression reference

    File "./let_definition_missing.tla", line 10, characters 9-12:
    Error: Could not find label e
    File "./let_definition_missing.tla", line 10, characters 9-12:
    Error: Could not resolve subexpression reference
     tlapm ending abnormally with Failure("Expr.Anon: 2")
---*)
