(*---
description: A <*> step is unnamed, so its fact is visible to later steps like that of a <1> step.
ref: src/proof/p_parser.ml#to_steps
mode: obligations
outcome: proved
---*)
---- MODULE star_step_unnamed ----
CONSTANT c
THEOREM c = c
<*> c = c
  OBVIOUS
<*> QED
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
           <0>_a3 
    PROVE  c = c

    @type: obligation
    @id: 2
    @loc: 11:3:11:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
    PROVE  c = c

    @type: obligationsnumber
    @count: 2
---*)
