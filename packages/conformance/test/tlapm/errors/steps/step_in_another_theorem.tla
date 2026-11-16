(*---
description: Step names are local to a theorem's proof, so a later theorem cannot cite them.
ref: src/expr/e_anon.ml#anons
mode: obligations
outcome: rejected
---*)
---- MODULE step_in_another_theorem ----
THEOREM TRUE
<1>1. TRUE OBVIOUS
<1> QED BY <1>1
THEOREM TRUE BY <1>1
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./step_in_another_theorem.tla", line 11, characters 17-20

    Operator "<1>1" not found

    File "./step_in_another_theorem.tla", line 11, characters 17-20:
    Error: Operator "<1>1" not found
     tlapm ending abnormally with Failure("Expr.Anon: 4")
---*)
