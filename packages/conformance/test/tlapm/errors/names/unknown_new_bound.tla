(*---
description: An undefined name in the bound of a NEW declaration is rejected with Operator not found.
ref: src/expr/e_anon.ml#anons
mode: obligations
outcome: rejected
---*)
---- MODULE unknown_new_bound ----
THEOREM ASSUME NEW c \in S PROVE TRUE OBVIOUS
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./unknown_new_bound.tla", line 8, character 26

    Operator "S" not found

    File "./unknown_new_bound.tla", line 8, character 26:
    Error: Operator "S" not found
     tlapm ending abnormally with Failure("Expr.Anon: 4")
---*)
