(*---
description: WITNESS sees an existential through a definition of the goal.
ref: src/proof/p_simplify.ml#expose_connective
mode: obligations
outcome: proved
---*)
---- MODULE witness_through_definition ----
CONSTANT P(_)
Goal == \E x : P(x)
THEOREM Goal
<1> WITNESS 1
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
    @obl: ASSUME NEW CONSTANT P(_)
    PROVE  P(1)

    @type: obligation
    @id: 2
    @loc: 11:1:11:14
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           <1>_a3 
    PROVE  Goal

    @type: obligationsnumber
    @count: 2
---*)
