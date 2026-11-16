(*---
description: A HIDE DEF step hides a definition that a module-level USE made visible.
ref: src/proof/p_gen.ml#gen_step
mode: obligations
outcome: proved
---*)
---- MODULE step_hide_def ----
CONSTANT c
Op == c
USE DEF Op
THEOREM Op = c
<1> HIDE DEF Op
<1> QED
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 14:3:14:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
    PROVE  Op = c

    @type: obligationsnumber
    @count: 1
---*)
