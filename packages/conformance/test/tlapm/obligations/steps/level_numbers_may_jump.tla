(*---
description: A subproof's level need only exceed its parent's, so <3> steps may directly follow a <1> step.
ref: src/proof/p_parser.ml#to_steps
mode: obligations
outcome: proved
---*)
---- MODULE level_numbers_may_jump ----
THEOREM TRUE
<1>1. TRUE
  <3>1. TRUE
    OBVIOUS
  <3> QED
    BY <3>1
<1> QED
  BY <1>1
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 15:3:15:5
    @status: to be proved
    @obl: ASSUME <1>1 
    PROVE  TRUE

    @type: obligation
    @id: 2
    @loc: 15:6:15:10
    @status: to be proved
    @obl: <1>1

    @type: obligation
    @id: 3
    @loc: 13:5:13:7
    @status: to be proved
    @obl: ASSUME <3>1 
    PROVE  TRUE

    @type: obligation
    @id: 4
    @loc: 13:8:13:12
    @status: to be proved
    @obl: <3>1

    @type: obligation
    @id: 5
    @loc: 11:5:11:12
    @status: to be proved
    @obl: TRUE

    @type: obligationsnumber
    @count: 5
---*)
