(*---
description: A module-level USE DEF of an undefined name is rejected with Operator not found.
ref: src/expr/e_anon.ml#anons
mode: obligations
outcome: rejected
---*)
---- MODULE unknown_module_use_def ----
USE DEF y
THEOREM TRUE OBVIOUS
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./unknown_module_use_def.tla", line 8, character 9

    Operator "y" not found

    File "./unknown_module_use_def.tla", line 8, character 9:
    Error: Operator "y" not found
     tlapm ending abnormally with Failure("Expr.Anon: 4")
---*)
