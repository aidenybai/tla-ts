(*---
description: A step name that no step of the proof defines is rejected with Operator not found.
ref: src/expr/e_anon.ml#anons
mode: obligations
outcome: rejected
---*)
---- MODULE undefined_step ----
THEOREM TRUE
<1>1. TRUE OBVIOUS
<1> QED BY <1>2
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./undefined_step.tla", line 10, characters 12-15

    Operator "<1>2" not found

    File "./undefined_step.tla", line 10, characters 12-15:
    Error: Operator "<1>2" not found
     tlapm ending abnormally with Failure("Expr.Anon: 4")
---*)
