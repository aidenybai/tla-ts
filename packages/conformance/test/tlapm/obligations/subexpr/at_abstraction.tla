(*---
description: Op!@ abstracts the body of a quantifier over its bound variable, so it prints as a LAMBDA.
ref: src/expr/e_deref.ml#deref_at
mode: obligations
outcome: proved
---*)
---- MODULE at_abstraction ----
CONSTANT P(_)
Op == \A x : P(x)
THEOREM Op!@ = Op!@
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 11:3:11:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_)
    PROVE  (LAMBDA x : P(x)) = (LAMBDA x : P(x))

    @type: obligationsnumber
    @count: 1
---*)
