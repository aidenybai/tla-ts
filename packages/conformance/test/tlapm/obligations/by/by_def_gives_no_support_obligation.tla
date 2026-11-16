(*---
description: Citing only definitions gives no support obligation, only the main one.
ref: src/proof/p_simplify.ml#simplify
mode: obligations
outcome: proved
---*)
---- MODULE by_def_gives_no_support_obligation ----
CONSTANT c
Op == c
THEOREM Op = c
  BY DEF Op
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
