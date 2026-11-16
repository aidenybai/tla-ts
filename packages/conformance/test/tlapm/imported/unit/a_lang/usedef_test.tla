(*---
description: tlapm's own test unit/a_lang/usedef_test.tla.
ref: test/unit/a_lang/usedef_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE usedef_test ----

EXTENDS TLAPS

C == TRUE

THEOREM C
    BY DEF C

====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 16:5:16:7
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 16:5:16:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligationsnumber
    @count: 1

    File "./usedef_test.tla", line 9, character 1 to line 18, character 4:
    [INFO]: All 1 obligation proved.
---*)
