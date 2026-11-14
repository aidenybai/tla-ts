(*---
description: A module-level USE DEF makes the definition visible in later theorems, with no support obligation.
ref: src/proof/p_gen.ml#mutate
mode: obligations
outcome: proved
---*)
---- MODULE module_use_def ----
CONSTANT c
Op == c
USE DEF Op
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

    @type: obligationsnumber
    @count: 1
---*)
