(*---
description: tlapm's own test unit/a_lang/usethm_test.tla.
ref: test/unit/a_lang/usethm_test.tla
features:
  - tlapm-test
mode: proof
outcome: incomplete
---*)
---- MODULE usethm_test ----

EXTENDS TLAPS

THEOREM Thm == FALSE

THEOREM FALSE
    BY Thm

====

(*--- recorded
all:
  exit: 11
  transcript: |-
    @type: obligation
    @id: 2
    @loc: 16:5:16:7
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 16:5:16:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 3
    @loc: 16:8:16:11
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 16:8:16:11
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    Missing proof at File "./usethm_test.tla", line 13, character 21
    File "./usethm_test.tla", line 9, character 1 to line 18, character 4:
    [ERROR]: Proof incomplete in module "usethm_test": 1 missing, 0 omitted proof step(s).
    File "./usethm_test.tla", line 9, character 1 to line 18, character 4:
    [INFO]: All 2 obligations proved.
---*)
