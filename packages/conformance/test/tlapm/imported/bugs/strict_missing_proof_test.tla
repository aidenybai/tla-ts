(*---
description: tlapm's own test bugs/strict_missing_proof_test.tla, which checks stderr Missing proof at; stderr Proof incomplete in module.
ref: test/bugs/strict_missing_proof_test.tla
features:
  - tlapm-test
mode: proof
outcome: incomplete
---*)
---- MODULE strict_missing_proof_test ----

(* Regression test for https://github.com/tlaplus/tlapm/issues/271

   A step whose proof is absent (here the bare QED step) generates no
   obligation, so without `--strict` the run reports "All 0 obligation proved"
   and exits 0, hiding the incomplete proof. With `--strict` the missing proof
   is reported as an error and tlapm exits with code 11 (incomplete proof).
*)

THEOREM TRUE
<1> QED

====

(*--- recorded
all:
  exit: 11
  transcript: |-
    @type: obligationsnumber
    @count: 0

    Missing proof at File "./strict_missing_proof_test.tla", line 20, characters 1-7
    File "./strict_missing_proof_test.tla", line 9, character 1 to line 22, character 4:
    [ERROR]: Proof incomplete in module "strict_missing_proof_test": 1 missing, 0 omitted proof step(s).
    File "./strict_missing_proof_test.tla", line 9, character 1 to line 22, character 4:
    [INFO]: All 0 obligation proved.
---*)
