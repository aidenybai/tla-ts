(*---
description: Each fact cited in BY gives a support obligation that proves the fact, located at the fact, after the main obligation.
ref: src/proof/p_simplify.ml#simplify
mode: obligations
outcome: proved
---*)
---- MODULE by_fact_support_obligation ----
CONSTANT c
THEOREM ASSUME c = 1 PROVE c = 1
  BY c = 1
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 10:3:10:5
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           c = 1 ,
           c = 1 
    PROVE  c = 1

    @type: obligation
    @id: 2
    @loc: 10:6:10:11
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           c = 1 
    PROVE  c = 1

    @type: obligationsnumber
    @count: 2
---*)
