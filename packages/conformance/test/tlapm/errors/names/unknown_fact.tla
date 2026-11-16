(*---
description: A fact name in BY that no theorem, axiom or step defines is rejected with Operator not found.
ref: src/expr/e_anon.ml#anons
mode: obligations
outcome: rejected
---*)
---- MODULE unknown_fact ----
THEOREM TRUE
BY T2
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./unknown_fact.tla", line 9, characters 4-5

    Operator "T2" not found

    File "./unknown_fact.tla", line 9, characters 4-5:
    Error: Operator "T2" not found
     tlapm ending abnormally with Failure("Expr.Anon: 4")
---*)
