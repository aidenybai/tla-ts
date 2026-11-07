(*---
description: The QED step's obligation proves the theorem's goal.
ref: src/proof/p_gen.ml#generate
mode: obligations
outcome: proved
---*)
---- MODULE qed_goal_is_theorem_goal ----
CONSTANT c
THEOREM c = c
<1> QED
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 11:3:11:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
    PROVE  c = c

    @type: obligationsnumber
    @count: 1
---*)
