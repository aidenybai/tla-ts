(*---
description: An expression cited in BY is a fact too, so its support obligation proves the expression from the current context.
ref: src/proof/p_gen.ml#gen_step
mode: obligations
outcome: proved
---*)
---- MODULE by_expression_fact ----
EXTENDS Naturals
THEOREM 1 + 1 = 2
  BY 1 = 1
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 10:3:10:5
    @status: to be proved
    @obl: ASSUME 1 = 1 
    PROVE  1 + 1 = 2

    @type: obligation
    @id: 2
    @loc: 10:6:10:11
    @status: to be proved
    @obl: 1 = 1

    @type: obligationsnumber
    @count: 2
---*)
