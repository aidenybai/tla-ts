(*---
description: A bound variable is in scope only inside its quantifier, so using it after the quantifier is rejected.
ref: src/expr/e_anon.ml#anons
mode: obligations
outcome: rejected
---*)
---- MODULE bound_variable_scoped ----
CONSTANT S
THEOREM (\A x \in S : x = x) /\ x = x OBVIOUS
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./bound_variable_scoped.tla", line 9, character 33

    Operator "x" not found

    File "./bound_variable_scoped.tla", line 9, character 33:
    Error: Operator "x" not found
     tlapm ending abnormally with Failure("Expr.Anon: 4")
---*)
