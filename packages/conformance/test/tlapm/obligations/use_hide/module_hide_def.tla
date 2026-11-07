(*---
description: A module-level HIDE DEF hides a definition made visible earlier, for the theorems after it.
ref: src/proof/p_gen.ml#mutate
mode: obligations
outcome: proved
---*)
---- MODULE module_hide_def ----
CONSTANT c
Op == c
USE DEF Op
THEOREM Op = c
  OBVIOUS
HIDE DEF Op
THEOREM Op = c
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
    @obl: ASSUME NEW CONSTANT c,
           Op == c
    PROVE  Op = c

    @type: obligation
    @id: 2
    @loc: 15:3:15:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
    PROVE  Op = c

    @type: obligationsnumber
    @count: 2
---*)
