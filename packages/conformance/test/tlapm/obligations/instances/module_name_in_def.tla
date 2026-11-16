(*---
description: A module name in a DEF clause is an unknown operator.
ref: src/proof/p_anon.ml#usable
mode: obligations
outcome: rejected
---*)
---- MODULE module_name_in_def ----
EXTENDS Naturals
THEOREM 1 + 1 = 2
  BY DEF Naturals
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./module_name_in_def.tla", line 10, characters 10-17

    Operator "Naturals" not found

    File "./module_name_in_def.tla", line 10, characters 10-17:
    Error: Operator "Naturals" not found
     tlapm ending abnormally with Failure("Expr.Anon: 4")
---*)
