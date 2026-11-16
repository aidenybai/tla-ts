(*---
description: PROOF may precede the first step of a top-level proof.
ref: src/proof/p_parser.ml#toplevel
mode: obligations
outcome: proved
---*)
---- MODULE proof_keyword_first_step ----
THEOREM TRUE
PROOF
<1>1. TRUE
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
    @loc: 13:3:13:5
    @status: to be proved
    @obl: ASSUME <1>1 
    PROVE  TRUE

    @type: obligation
    @id: 2
    @loc: 13:6:13:10
    @status: to be proved
    @obl: <1>1

    @type: obligation
    @id: 3
    @loc: 11:3:11:10
    @status: to be proved
    @obl: TRUE

    @type: obligationsnumber
    @count: 3
---*)
