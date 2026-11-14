(*---
description: A step without a proof is missing, so the run is incomplete, while the other steps still give obligations.
ref: src/proof/p_gen.ml#generate
mode: obligations
outcome: incomplete
---*)
---- MODULE step_without_proof_incomplete ----
THEOREM TRUE
<1>1. TRUE
<1> QED
  BY <1>1
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 11:3:11:5
    @status: to be proved
    @obl: ASSUME <1>1 
    PROVE  TRUE

    @type: obligation
    @id: 2
    @loc: 11:6:11:10
    @status: to be proved
    @obl: <1>1

    @type: obligationsnumber
    @count: 2

    Missing proof at File "./step_without_proof_incomplete.tla", line 9, characters 1-10
    File "./step_without_proof_incomplete.tla", line 7, character 1 to line 12, character 4:
    [ERROR]: Proof incomplete in module "step_without_proof_incomplete": 1 missing, 0 omitted proof step(s).
---*)
