(*---
description: tlapm's own test unit/b_logic/existential_test.tla.
ref: test/unit/b_logic/existential_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE existential_test ----

EXTENDS TLAPS

THEOREM ASSUME NEW P(_),
               NEW a,
               P(a)
        PROVE \E x : P(x)
    OBVIOUS

====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 17:5:17:12
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 17:5:17:12
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligationsnumber
    @count: 1

    File "./existential_test.tla", line 9, character 1 to line 19, character 4:
    [INFO]: All 1 obligation proved.
---*)
