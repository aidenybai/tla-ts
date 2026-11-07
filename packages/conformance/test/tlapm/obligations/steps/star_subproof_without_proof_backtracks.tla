(*---
description: Without PROOF, a <*> step after a step continues the parent's level, so the step before it has a missing proof.
ref: src/proof/p_parser.ml#to_steps
mode: obligations
outcome: incomplete
---*)
---- MODULE star_subproof_without_proof_backtracks ----
THEOREM TRUE
<1>1. TRUE
<*> TRUE
  OBVIOUS
<1> QED
  OBVIOUS
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 13:3:13:10
    @status: to be proved
    @obl: ASSUME <1>_a3 
    PROVE  TRUE

    @type: obligation
    @id: 3
    @loc: 11:3:11:10
    @status: to be proved
    @obl: TRUE

    @type: obligationsnumber
    @count: 2

    Missing proof at File "./star_subproof_without_proof_backtracks.tla", line 9, characters 1-10
    File "./star_subproof_without_proof_backtracks.tla", line 7, character 1 to line 14, character 4:
    [ERROR]: Proof incomplete in module "star_subproof_without_proof_backtracks": 1 missing, 0 omitted proof step(s).
---*)
