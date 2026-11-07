(*---
description: tlapm's own test unit/b_logic/universal_test.tla.
ref: test/unit/b_logic/universal_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE universal_test ----

EXTENDS TLAPS

THEOREM ASSUME NEW P(_)
        PROVE \A x : P(x) => P(x)
    OBVIOUS

====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 15:5:15:12
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 15:5:15:12
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligationsnumber
    @count: 1

    File "./universal_test.tla", line 9, character 1 to line 17, character 4:
    [INFO]: All 1 obligation proved.
---*)
