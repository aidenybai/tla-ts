(*---
description: An action-level assumption in a theorem's ASSUME is accepted alongside a CONSTANT declaration.
ref: src/expr/e_levels.ml#level_computation
mode: obligations
outcome: proved
---*)
---- MODULE action_in_assume_accepted ----
VARIABLE x
THEOREM ASSUME CONSTANT c, c = x' PROVE TRUE OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 9:46:9:53
    @status: to be proved
    @obl: ASSUME NEW VARIABLE x,
           NEW CONSTANT c,
           c = x' 
    PROVE  TRUE

    @type: obligationsnumber
    @count: 1
---*)
