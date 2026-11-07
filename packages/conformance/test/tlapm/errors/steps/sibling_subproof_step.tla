(*---
description: A step of one subproof is out of scope in the subproof of a later step, even at the same level.
ref: src/expr/e_anon.ml#anons
mode: obligations
outcome: rejected
---*)
---- MODULE sibling_subproof_step ----
THEOREM TRUE
<1>1. TRUE
  <2>1. TRUE OBVIOUS
  <2> QED BY <2>1
<1>2. TRUE
  <2> QED BY <2>1
<1> QED BY <1>1, <1>2
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./sibling_subproof_step.tla", line 13, characters 14-17

    Operator "<2>1" not found

    File "./sibling_subproof_step.tla", line 13, characters 14-17:
    Error: Operator "<2>1" not found
     tlapm ending abnormally with Failure("Expr.Anon: 4")
---*)
