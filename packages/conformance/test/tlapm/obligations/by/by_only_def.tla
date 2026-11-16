(*---
description: BY ONLY DEF without facts still hides the earlier visible facts.
ref: src/proof/p_simplify.ml#simplify
mode: obligations
outcome: proved
---*)
---- MODULE by_only_def ----
CONSTANT c
Op == c
THEOREM ASSUME c = 1 PROVE Op = c
  BY ONLY DEF Op
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 11:3:11:5
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           Op == c
    PROVE  Op = c

    @type: obligationsnumber
    @count: 1
---*)
