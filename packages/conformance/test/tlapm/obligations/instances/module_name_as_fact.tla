(*---
description: A module name is not an operator, so citing an extended module as a fact is an unknown operator.
ref: src/expr/e_anon.ml#anon_sg
mode: obligations
outcome: rejected
---*)
---- MODULE module_name_as_fact ----
EXTENDS Naturals
THEOREM 1 + 1 = 2
  BY Naturals
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./module_name_as_fact.tla", line 10, characters 6-13

    Operator "Naturals" not found

    File "./module_name_as_fact.tla", line 10, characters 6-13:
    Error: Operator "Naturals" not found
     tlapm ending abnormally with Failure("Expr.Anon: 4")
---*)
