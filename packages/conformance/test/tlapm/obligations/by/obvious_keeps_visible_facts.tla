(*---
description: OBVIOUS uses the visible facts of the context as they are, giving one obligation.
ref: src/proof/p_gen.ml#generate
mode: obligations
outcome: proved
---*)
---- MODULE obvious_keeps_visible_facts ----
CONSTANT c
THEOREM ASSUME c = 1 PROVE c = 1
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 10:3:10:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           c = 1 
    PROVE  c = 1

    @type: obligationsnumber
    @count: 1
---*)
