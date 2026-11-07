(*---
description: The fact of a numbered step is hidden from later steps, so the QED obligation does not print it.
ref: src/proof/p_gen.ml#use_assertion
mode: obligations
outcome: proved
---*)
---- MODULE named_step_fact_hidden ----
CONSTANT c
THEOREM c = c
<1>1. c = c
  OBVIOUS
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
    @obl: ASSUME NEW CONSTANT c
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
