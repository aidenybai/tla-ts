(*---
description: tlapm's own test unit/a_lang/tempop_test.tla.
ref: test/unit/a_lang/tempop_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE tempop_test ----

EXTENDS TLAPS

VARIABLE v

F(x) == x = v

THEOREM ASSUME NEW x,
               F(x)'
        PROVE TRUE
    OBVIOUS

====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 20:5:20:12
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 20:5:20:12
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligationsnumber
    @count: 1

    File "./tempop_test.tla", line 9, character 1 to line 22, character 4:
    [INFO]: All 1 obligation proved.
---*)
