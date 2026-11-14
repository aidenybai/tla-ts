(*---
description: BY ONLY hides the facts that were visible before it in the main obligation, keeping only the cited ones.
ref: src/proof/p_gen.ml#gen_step
mode: obligations
outcome: proved
---*)
---- MODULE by_only_hides_earlier_facts ----
CONSTANT c
THEOREM ASSUME c = 1, c = 2 PROVE c = 1
  BY ONLY c = 1
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
           c = 1 
    PROVE  c = 1

    @type: obligation
    @id: 2
    @loc: 10:11:10:16
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           c = 1 ,
           c = 2 
    PROVE  c = 1

    @type: obligationsnumber
    @count: 2
---*)
