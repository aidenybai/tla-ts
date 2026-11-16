(*---
description: Level 0 steps are accepted at the top of a proof and are cited as <0>n.
ref: src/proof/p_parser.ml#to_steps
mode: obligations
outcome: proved
---*)
---- MODULE level_zero_steps ----
THEOREM TRUE
<0>1. TRUE
  OBVIOUS
<0> QED
  BY <0>1
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 12:3:12:5
    @status: to be proved
    @obl: ASSUME <0>1 
    PROVE  TRUE

    @type: obligation
    @id: 2
    @loc: 12:6:12:10
    @status: to be proved
    @obl: <0>1

    @type: obligation
    @id: 3
    @loc: 10:3:10:10
    @status: to be proved
    @obl: TRUE

    @type: obligationsnumber
    @count: 3
---*)
