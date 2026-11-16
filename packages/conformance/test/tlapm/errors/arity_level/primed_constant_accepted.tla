(*---
description: A primed constant is not a level error for tlapm, and c' prints as written.
ref: src/expr/e_levels.ml#level_computation
mode: obligations
outcome: proved
---*)
---- MODULE primed_constant_accepted ----
CONSTANT c
THEOREM c' = c OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 9:16:9:23
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
    PROVE  c' = c

    @type: obligationsnumber
    @count: 1
---*)
