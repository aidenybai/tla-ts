(*---
description: A QED step may carry a label, and the label does not change its obligation.
ref: src/proof/p_parser.ml#to_steps
mode: obligations
outcome: proved
---*)
---- MODULE named_qed_step ----
THEOREM TRUE
<1>1. TRUE
  OBVIOUS
<1>q QED
  BY <1>1
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 12:3:12:5
    @status: to be proved
    @obl: ASSUME <1>1 
    PROVE  TRUE

    @type: obligation
    @id: 2
    @loc: 12:6:12:10
    @status: to be proved
    @obl: <1>1

    @type: obligation
    @id: 3
    @loc: 10:3:10:10
    @status: to be proved
    @obl: TRUE

    @type: obligationsnumber
    @count: 3
---*)
