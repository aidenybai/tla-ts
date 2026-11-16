(*---
description: HIDE of a step name hides the fact that an earlier USE of the step made visible.
ref: src/proof/p_gen.ml#set_expr
mode: obligations
outcome: proved
---*)
---- MODULE step_hide_named_step ----
CONSTANT c
THEOREM c = c
<1>1. c = c
  OBVIOUS
<1> USE <1>1
<1> HIDE <1>1
<1> QED
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 15:3:15:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
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
