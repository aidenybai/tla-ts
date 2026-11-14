(*---
description: Each obligation's location is that of the leaf proof it comes from, and a support obligation's location is that of the cited fact.
ref: src/proof/p_simplify.ml#simplify
mode: obligations
outcome: proved
---*)
---- MODULE step_obligation_location ----
THEOREM TRUE
<1>1. TRUE
  OBVIOUS
<1> QED   BY   <1>1
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 11:11:11:13
    @status: to be proved
    @obl: ASSUME <1>1 
    PROVE  TRUE

    @type: obligation
    @id: 2
    @loc: 11:16:11:20
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
