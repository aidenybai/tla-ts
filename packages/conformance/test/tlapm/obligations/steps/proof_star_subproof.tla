(*---
description: PROOF before a <*> step makes it open a subproof below its parent step.
ref: src/proof/p_parser.ml#to_steps
mode: obligations
outcome: proved
---*)
---- MODULE proof_star_subproof ----
THEOREM TRUE
<1>1. TRUE
  PROOF <*> TRUE
    OBVIOUS
  <*> QED
    OBVIOUS
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
    @loc: 13:5:13:12
    @status: to be proved
    @obl: ASSUME <2>_a4 
    PROVE  TRUE

    @type: obligation
    @id: 4
    @loc: 11:5:11:12
    @status: to be proved
    @obl: TRUE

    @type: obligationsnumber
    @count: 4
---*)
