(*---
description: A LET definition is in scope only in the LET body, so using it in a later theorem is rejected.
ref: src/expr/e_anon.ml#anons
mode: obligations
outcome: rejected
---*)
---- MODULE let_scoped_to_body ----
THEOREM LET F == 1 IN F = F OBVIOUS
THEOREM F = F OBVIOUS
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./let_scoped_to_body.tla", line 9, character 9

    Operator "F" not found

    File "./let_scoped_to_body.tla", line 9, character 9:
    Error: Operator "F" not found
     tlapm ending abnormally with Failure("Expr.Anon: 4")
---*)
