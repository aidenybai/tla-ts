(*---
description: DEFS is a synonym of DEF.
ref: src/proof/p_parser.ml#usebody
mode: obligations
outcome: proved
---*)
---- MODULE by_defs_keyword ----
CONSTANT c
Op1 == c
Op2 == Op1
THEOREM Op2 = c
  BY DEFS Op1, Op2
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
           Op1 == c,
           Op2 == Op1
    PROVE  Op2 = c

    @type: obligationsnumber
    @count: 1
---*)
