(*---
description: A USE DEF followed by HIDE DEF in the same proof leaves the definition hidden for the later steps.
ref: src/proof/p_gen.ml#set_defn
mode: obligations
outcome: proved
---*)
---- MODULE step_use_then_hide_def ----
CONSTANT c
Op == c
THEOREM Op = c
<1> USE DEF Op
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
