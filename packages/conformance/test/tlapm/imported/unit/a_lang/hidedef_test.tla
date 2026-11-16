(*---
description: tlapm's own test unit/a_lang/hidedef_test.tla.
ref: test/unit/a_lang/hidedef_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE hidedef_test ----

EXTENDS TLAPS

C == TRUE
HIDE DEF C

THEOREM TRUE
    BY C = C

====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 17:5:17:7
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 17:5:17:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 2
    @loc: 17:8:17:13
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 17:8:17:13
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./hidedef_test.tla", line 9, character 1 to line 19, character 4:
    [INFO]: All 2 obligations proved.
---*)
