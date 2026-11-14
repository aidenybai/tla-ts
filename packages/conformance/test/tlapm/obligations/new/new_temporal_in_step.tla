(*---
description: A step's ASSUME may declare a NEW TEMPORAL for its proof.
ref: src/expr/e_parser.ml#hyp
mode: obligations
outcome: proved
---*)
---- MODULE new_temporal_in_step ----
THEOREM TRUE
<1>1. ASSUME NEW TEMPORAL F PROVE []F => F
  OBVIOUS
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
    @obl: TRUE

    @type: obligation
    @id: 2
    @loc: 10:3:10:10
    @status: to be proved
    @obl: ASSUME NEW TEMPORAL F
    PROVE  []F => F

    @type: obligationsnumber
    @count: 2
---*)
