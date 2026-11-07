(*---
description: TAKE sees a universal through a definition of the goal.
ref: src/proof/p_simplify.ml#expose_connective
mode: obligations
outcome: proved
---*)
---- MODULE take_through_definition ----
CONSTANT P(_)
Goal == \A x : P(x)
THEOREM Goal
<1> TAKE y
<1> QED
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 13:3:13:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           NEW CONSTANT y
    PROVE  P(y)

    @type: obligation
    @id: 2
    @loc: 11:1:11:11
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           <1>_a3 
    PROVE  Goal

    @type: obligation
    @id: 3
    @loc: 11:1:11:11
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           <1>_a3 
    PROVE  <1>_a3

    @type: obligationsnumber
    @count: 3
---*)
