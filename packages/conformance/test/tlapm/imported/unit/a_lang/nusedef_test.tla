(*---
description: tlapm's own test unit/a_lang/nusedef_test.tla.
ref: test/unit/a_lang/nusedef_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE nusedef_test ----

EXTENDS TLAPS

C == TRUE

THEOREM TRUE
    OBVIOUS

====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 16:5:16:12
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 16:5:16:12
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligationsnumber
    @count: 1

    File "./nusedef_test.tla", line 9, character 1 to line 18, character 4:
    [INFO]: All 1 obligation proved.
---*)
