(*---
description: Citing a step at a level that has not started is rejected with Operator not found.
ref: src/expr/e_anon.ml#anons
mode: obligations
outcome: rejected
---*)
---- MODULE deeper_level_not_started ----
THEOREM TRUE
<1>1. TRUE OBVIOUS
<1> QED BY <2>1
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./deeper_level_not_started.tla", line 10, characters 12-15

    Operator "<2>1" not found

    File "./deeper_level_not_started.tla", line 10, characters 12-15:
    Error: Operator "<2>1" not found
     tlapm ending abnormally with Failure("Expr.Anon: 4")
---*)
