(*---
description: tlapm's own test unit/b_logic/universal_bounded_test.tla.
ref: test/unit/b_logic/universal_bounded_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE universal_bounded_test ----

EXTENDS TLAPS

THEOREM ASSUME NEW P(_),
               NEW s
        PROVE \A x \in s : P(x) => P(x)
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

    File "./universal_bounded_test.tla", line 9, character 1 to line 18, character 4:
    [INFO]: All 1 obligation proved.
---*)
