(*---
description: HAVE sees an implication through a definition of the goal, because expose_connective unfolds it.
ref: src/proof/p_simplify.ml#expose_connective
mode: obligations
outcome: proved
---*)
---- MODULE have_through_definition ----
CONSTANT A, B
Goal == A => B
THEOREM Goal
<1> HAVE A
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
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B,
           A 
    PROVE  B

    @type: obligation
    @id: 2
    @loc: 11:1:11:11
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B,
           <1>_a3 
    PROVE  Goal

    @type: obligation
    @id: 3
    @loc: 11:1:11:11
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B,
           <1>_a3 
    PROVE  <1>_a3

    @type: obligationsnumber
    @count: 3
---*)
