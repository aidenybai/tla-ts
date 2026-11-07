(*---
description: BY ONLY hides facts but not definitions made visible earlier.
ref: src/proof/p_gen.ml#gen_step
mode: obligations
outcome: proved
---*)
---- MODULE by_only_keeps_definitions ----
CONSTANT c
Op == c
USE DEF Op
THEOREM ASSUME c = 1 PROVE Op = c
  BY ONLY TRUE
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 12:3:12:5
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           Op == c,
           TRUE 
    PROVE  Op = c

    @type: obligation
    @id: 2
    @loc: 12:11:12:15
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           Op == c,
           c = 1 
    PROVE  TRUE

    @type: obligationsnumber
    @count: 2
---*)
