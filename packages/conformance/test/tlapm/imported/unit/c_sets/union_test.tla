(*---
description: tlapm's own test unit/c_sets/union_test.tla.
ref: test/unit/c_sets/union_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE union_test ----

EXTENDS TLAPS

THEOREM ASSUME NEW a
        PROVE \A x : x \in UNION a <=> \E y : y \in a /\ x \in y
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

    File "./union_test.tla", line 9, character 1 to line 17, character 4:
    [INFO]: All 1 obligation proved.
---*)
