(*---
description: tlapm's own test unit/b_logic/critical_bounded_test.tla.
ref: test/unit/b_logic/critical_bounded_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE critical_bounded_test ----

EXTENDS TLAPS

THEOREM ASSUME NEW P(_),
               NEW s,
               NEW a \in s,
               P(a)
        PROVE P(CHOOSE x \in s : P(x))
    OBVIOUS

====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 18:5:18:12
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 18:5:18:12
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligationsnumber
    @count: 1

    File "./critical_bounded_test.tla", line 9, character 1 to line 20, character 4:
    [INFO]: All 1 obligation proved.
---*)
