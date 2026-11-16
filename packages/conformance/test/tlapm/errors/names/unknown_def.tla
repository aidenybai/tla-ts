(*---
description: A name in BY DEF that is not defined is rejected with Operator not found.
ref: src/expr/e_anon.ml#anons
mode: obligations
outcome: rejected
---*)
---- MODULE unknown_def ----
THEOREM TRUE BY DEF y
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./unknown_def.tla", line 8, character 21

    Operator "y" not found

    File "./unknown_def.tla", line 8, character 21:
    Error: Operator "y" not found
     tlapm ending abnormally with Failure("Expr.Anon: 4")
---*)
