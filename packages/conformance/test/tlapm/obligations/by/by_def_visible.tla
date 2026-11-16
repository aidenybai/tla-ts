(*---
description: BY DEF makes the cited definition visible, so the main obligation prints it in the context.
ref: src/proof/p_gen.ml#set_defn
mode: obligations
outcome: proved
---*)
---- MODULE by_def_visible ----
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
