(*---
description: TAKE with two names takes the variables of two nested universals in turn.
ref: src/proof/p_simplify.ml#simplify_step
mode: obligations
outcome: proved
---*)
---- MODULE take_nested_universals ----
CONSTANT P(_, _)
THEOREM \A x : \A y : P(x, y)
<1> TAKE a, b
<1> QED
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 12:3:12:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_, _),
           NEW CONSTANT a,
           NEW CONSTANT b
    PROVE  P(a, b)

    @type: obligation
    @id: 2
    @loc: 10:1:10:14
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_, _),
           <1>_a3 
    PROVE  \A x : \A y : P(x, y)

    @type: obligation
    @id: 3
    @loc: 10:1:10:14
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_, _),
           <1>_a3 
    PROVE  <1>_a3

    @type: obligationsnumber
    @count: 3
---*)
