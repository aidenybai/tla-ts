(*---
description: HIDE of the bound of a NEW declaration hides the bound, so the declaration prints without it.
ref: src/proof/p_gen.ml#domain_match
mode: obligations
outcome: proved
---*)
---- MODULE step_hide_new_bound ----
CONSTANT c
THEOREM ASSUME NEW a \in {c} PROVE a = c
<1> HIDE a \in {c}
<1> QED
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
           NEW CONSTANT a
    PROVE  a = c

    @type: obligationsnumber
    @count: 1
---*)
