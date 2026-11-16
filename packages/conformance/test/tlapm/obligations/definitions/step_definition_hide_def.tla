(*---
description: HIDE DEF hides a step definition for the later steps.
ref: src/proof/p_gen.ml#set_defn
mode: obligations
outcome: proved
---*)
---- MODULE step_definition_hide_def ----
CONSTANT c
THEOREM c = c
<1> F == c
<1> HIDE DEF F
<1> QED
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 13:3:13:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
    PROVE  c = c

    @type: obligationsnumber
    @count: 1
---*)
