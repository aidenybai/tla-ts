(*---
description: A QED step without a proof is a missing proof, so the run is incomplete while the other obligations are still generated.
ref: src/proof/p_gen.ml#generate
mode: obligations
outcome: incomplete
---*)
---- MODULE qed_without_proof_missing ----
THEOREM TRUE
<1>1. TRUE OBVIOUS
<1> QED
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    @type: obligation
    @id: 2
    @loc: 9:12:9:19
    @status: to be proved
    @obl: TRUE

    @type: obligationsnumber
    @count: 1

    Missing proof at File "./qed_without_proof_missing.tla", line 10, characters 1-7
    File "./qed_without_proof_missing.tla", line 7, character 1 to line 11, character 4:
    [ERROR]: Proof incomplete in module "qed_without_proof_missing": 1 missing, 0 omitted proof step(s).
---*)
