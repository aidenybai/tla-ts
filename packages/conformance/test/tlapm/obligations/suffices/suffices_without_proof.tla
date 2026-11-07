(*---
description: A SUFFICES step without a proof is missing, so the run is incomplete.
ref: src/proof/p_gen.ml#generate
mode: obligations
outcome: incomplete
---*)
---- MODULE suffices_without_proof ----
CONSTANT A, B
THEOREM A \/ B
<1> SUFFICES A
<1> QED
  OBVIOUS
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 12:3:12:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B
    PROVE  A

    @type: obligationsnumber
    @count: 1

    Missing proof at File "./suffices_without_proof.tla", line 10, characters 1-14
    File "./suffices_without_proof.tla", line 7, character 1 to line 13, character 4:
    [ERROR]: Proof incomplete in module "suffices_without_proof": 1 missing, 0 omitted proof step(s).
---*)
