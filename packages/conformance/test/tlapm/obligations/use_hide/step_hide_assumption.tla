(*---
description: A HIDE step hides an assumption of the theorem for the later steps.
ref: src/proof/p_gen.ml#set_expr
mode: obligations
outcome: proved
---*)
---- MODULE step_hide_assumption ----
CONSTANT c
THEOREM ASSUME c = 1 PROVE c = 1
<1> HIDE c = 1
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
    @obl: ASSUME NEW CONSTANT c
    PROVE  c = 1

    @type: obligationsnumber
    @count: 1
---*)
