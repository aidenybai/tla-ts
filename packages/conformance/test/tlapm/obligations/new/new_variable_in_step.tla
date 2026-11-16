(*---
description: A step's ASSUME may declare a NEW VARIABLE for its proof.
ref: src/expr/e_parser.ml#hyp
mode: obligations
outcome: proved
---*)
---- MODULE new_variable_in_step ----
THEOREM TRUE
<1>1. ASSUME NEW VARIABLE v PROVE v' = v'
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
    @obl: ASSUME NEW VARIABLE v
    PROVE  v' = v'

    @type: obligationsnumber
    @count: 2
---*)
