(*---
description: A CASE step without a proof is missing, so the run is incomplete.
ref: src/proof/p_gen.ml#generate
mode: obligations
outcome: incomplete
---*)
---- MODULE case_without_proof ----
CONSTANT A, B
THEOREM B
<1>1. CASE A
<1> QED
  BY <1>1
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 12:3:12:5
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B,
           <1>1 
    PROVE  B

    @type: obligation
    @id: 2
    @loc: 12:6:12:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B
    PROVE  <1>1

    @type: obligationsnumber
    @count: 2

    Missing proof at File "./case_without_proof.tla", line 10, characters 1-12
    File "./case_without_proof.tla", line 7, character 1 to line 13, character 4:
    [ERROR]: Proof incomplete in module "case_without_proof": 1 missing, 0 omitted proof step(s).
---*)
