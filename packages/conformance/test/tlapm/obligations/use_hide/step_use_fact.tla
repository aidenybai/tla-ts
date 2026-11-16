(*---
description: A USE step gives a support obligation, and its fact is visible in the later steps.
ref: src/proof/p_simplify.ml#simplify_step
mode: obligations
outcome: proved
---*)
---- MODULE step_use_fact ----
CONSTANT c
AXIOM A == c = 1
THEOREM c = 1
<1> USE A
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
    @obl: ASSUME NEW CONSTANT c,
           A == c = 1,
           A 
    PROVE  c = 1

    @type: obligation
    @id: 2
    @loc: 11:9:11:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           A == c = 1
    PROVE  A

    @type: obligationsnumber
    @count: 2
---*)
