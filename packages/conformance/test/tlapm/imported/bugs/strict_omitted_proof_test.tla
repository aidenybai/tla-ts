(*---
description: tlapm's own test bugs/strict_omitted_proof_test.tla, which checks stderr Omitted proof at; stderr Proof incomplete in module.
ref: test/bugs/strict_omitted_proof_test.tla
features:
  - tlapm-test
mode: proof
outcome: incomplete
---*)
---- MODULE strict_omitted_proof_test ----

(* Regression test for https://github.com/tlaplus/tlapm/issues/271

   An explicit OMITTED proof also generates no obligation. With `--strict` the
   omission is reported as an error and tlapm exits with code 11 (incomplete
   proof).
*)

THEOREM TRUE
OMITTED

====

(*--- recorded
all:
  exit: 11
  transcript: |-
    @type: obligationsnumber
    @count: 0

    Omitted proof at File "./strict_omitted_proof_test.tla", line 19, characters 1-7
    File "./strict_omitted_proof_test.tla", line 9, character 1 to line 21, character 4:
    [ERROR]: Proof incomplete in module "strict_omitted_proof_test": 0 missing, 1 omitted proof step(s).
    File "./strict_omitted_proof_test.tla", line 9, character 1 to line 21, character 4:
    [INFO]: All 0 obligation proved.
---*)
