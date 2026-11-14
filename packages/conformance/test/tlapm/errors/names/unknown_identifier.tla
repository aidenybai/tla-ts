(*---
description: An identifier that no declaration, definition or standard module defines is rejected with Operator not found.
ref: src/expr/e_anon.ml#anons
mode: obligations
outcome: rejected
---*)
---- MODULE unknown_identifier ----
CONSTANT c
THEOREM c = y OBVIOUS
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./unknown_identifier.tla", line 9, character 13

    Operator "y" not found

    File "./unknown_identifier.tla", line 9, character 13:
    Error: Operator "y" not found
     tlapm ending abnormally with Failure("Expr.Anon: 4")
---*)
