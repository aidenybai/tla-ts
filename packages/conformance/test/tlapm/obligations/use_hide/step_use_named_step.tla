(*---
description: A USE of an earlier numbered step makes its hidden fact visible for the later steps.
ref: src/proof/p_gen.ml#gen_step
mode: obligations
outcome: proved
---*)
---- MODULE step_use_named_step ----
CONSTANT c
THEOREM c = c
<1>1. c = c
  OBVIOUS
<1> USE <1>1
<1> QED
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 14:3:14:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           <1>1 
    PROVE  c = c

    @type: obligation
    @id: 2
    @loc: 11:3:11:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
    PROVE  c = c

    @type: obligation
    @id: 3
    @loc: 12:9:12:13
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
    PROVE  <1>1

    @type: obligationsnumber
    @count: 3
---*)
