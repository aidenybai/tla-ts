(*---
description: A numbered step followed directly by a step at the same level has no proof, so it counts as missing and the run is incomplete.
ref: src/proof/p_gen.ml#generate
mode: obligations
outcome: incomplete
---*)
---- MODULE step_without_proof_before_qed ----
THEOREM TRUE
<1>1. TRUE
<1> QED OBVIOUS
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 10:9:10:16
    @status: to be proved
    @obl: TRUE

    @type: obligationsnumber
    @count: 1

    Missing proof at File "./step_without_proof_before_qed.tla", line 9, characters 1-10
    File "./step_without_proof_before_qed.tla", line 7, character 1 to line 11, character 4:
    [ERROR]: Proof incomplete in module "step_without_proof_before_qed": 1 missing, 0 omitted proof step(s).
---*)
