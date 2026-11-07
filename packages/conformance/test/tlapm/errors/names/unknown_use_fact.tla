(*---
description: A USE of an undefined name in a step is rejected with Operator not found.
ref: src/expr/e_anon.ml#anons
mode: obligations
outcome: rejected
---*)
---- MODULE unknown_use_fact ----
THEOREM TRUE
<1> USE y
<1> QED OBVIOUS
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./unknown_use_fact.tla", line 9, character 9

    Operator "y" not found

    File "./unknown_use_fact.tla", line 9, character 9:
    Error: Operator "y" not found
     tlapm ending abnormally with Failure("Expr.Anon: 4")
---*)
