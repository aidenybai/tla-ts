(*---
description: A step of a subproof is out of scope after the subproof ends, so the outer QED cannot cite it.
ref: src/expr/e_anon.ml#anons
mode: obligations
outcome: rejected
---*)
---- MODULE inner_step_from_outside ----
THEOREM TRUE
<1>1. TRUE
  <2>1. TRUE OBVIOUS
  <2> QED BY <2>1
<1> QED BY <2>1
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./inner_step_from_outside.tla", line 12, characters 12-15

    Operator "<2>1" not found

    File "./inner_step_from_outside.tla", line 12, characters 12-15:
    Error: Operator "<2>1" not found
     tlapm ending abnormally with Failure("Expr.Anon: 4")
---*)
