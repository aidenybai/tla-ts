(*---
description: tlapm's own test bugs/strict_clean_test.tla, which checks nostderr Proof incomplete; nostderr No proof obligation found.
ref: test/bugs/strict_clean_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE strict_clean_test ----

(* Regression test for the `--strict` option (issues 271 and 276): a complete
   proof with all obligations discharged must still exit 0 under `--strict`,
   i.e. the strict checks must not introduce false positives.
*)

THEOREM TRUE OBVIOUS

====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 16:14:16:21
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 16:14:16:21
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligationsnumber
    @count: 1

    File "./strict_clean_test.tla", line 9, character 1 to line 18, character 4:
    [INFO]: All 1 obligation proved.
---*)
