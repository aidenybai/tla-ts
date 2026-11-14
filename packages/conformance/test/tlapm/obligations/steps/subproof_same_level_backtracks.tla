(*---
description: A step at its parent's level ends the parent's proof instead of opening a subproof, so the parent step has a missing proof.
ref: src/proof/p_parser.ml#to_steps
mode: obligations
outcome: incomplete
---*)
---- MODULE subproof_same_level_backtracks ----
THEOREM TRUE
<1>1. TRUE
<1>2. TRUE
  OBVIOUS
<1> QED
  BY <1>1, <1>2
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 13:3:13:5
    @status: to be proved
    @obl: ASSUME <1>1 ,
           <1>2 
    PROVE  TRUE

    @type: obligation
    @id: 2
    @loc: 13:6:13:10
    @status: to be proved
    @obl: <1>1

    @type: obligation
    @id: 3
    @loc: 13:12:13:16
    @status: to be proved
    @obl: ASSUME <1>1 
    PROVE  <1>2

    @type: obligation
    @id: 5
    @loc: 11:3:11:10
    @status: to be proved
    @obl: TRUE

    @type: obligationsnumber
    @count: 4

    Missing proof at File "./subproof_same_level_backtracks.tla", line 9, characters 1-10
    File "./subproof_same_level_backtracks.tla", line 7, character 1 to line 14, character 4:
    [ERROR]: Proof incomplete in module "subproof_same_level_backtracks": 1 missing, 0 omitted proof step(s).
---*)
