(*---
description: A USE ONLY step hides the facts visible before it, for the later steps.
ref: src/proof/p_simplify.ml#simplify_step
mode: obligations
outcome: proved
---*)
---- MODULE step_use_only ----
CONSTANT c
THEOREM ASSUME c = 1 PROVE c = 1
<1> USE ONLY TRUE
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
    @obl: ASSUME NEW CONSTANT c,
           TRUE 
    PROVE  c = 1

    @type: obligation
    @id: 2
    @loc: 10:14:10:18
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           c = 1 
    PROVE  TRUE

    @type: obligationsnumber
    @count: 2
---*)
