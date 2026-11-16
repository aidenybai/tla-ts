(*---
description: A QED step without a proof is missing, so the run is incomplete.
ref: src/proof/p_gen.ml#generate
mode: obligations
outcome: incomplete
---*)
---- MODULE qed_without_proof_incomplete ----
THEOREM TRUE
<1>1. TRUE
  OBVIOUS
<1> QED
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    @type: obligation
    @id: 2
    @loc: 10:3:10:10
    @status: to be proved
    @obl: TRUE

    @type: obligationsnumber
    @count: 1

    Missing proof at File "./qed_without_proof_incomplete.tla", line 11, characters 1-7
    File "./qed_without_proof_incomplete.tla", line 7, character 1 to line 12, character 4:
    [ERROR]: Proof incomplete in module "qed_without_proof_incomplete": 1 missing, 0 omitted proof step(s).
---*)
