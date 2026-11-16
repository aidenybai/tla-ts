(*---
description: A HIDE DEF of an undefined name in a step is rejected with Operator not found.
ref: src/expr/e_anon.ml#anons
mode: obligations
outcome: rejected
---*)
---- MODULE unknown_hide_def ----
THEOREM TRUE
<1> HIDE DEF y
<1> QED OBVIOUS
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./unknown_hide_def.tla", line 9, character 14

    Operator "y" not found

    File "./unknown_hide_def.tla", line 9, character 14:
    Error: Operator "y" not found
     tlapm ending abnormally with Failure("Expr.Anon: 4")
---*)
