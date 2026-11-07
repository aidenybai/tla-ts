(*---
description: tlapm's own test unit/e_arith/range_test.tla.
ref: test/unit/e_arith/range_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE range_test ----

EXTENDS TLAPS, Integers

THEOREM ASSUME NEW m \in Int,
               NEW n \in Int,
               NEW p
        PROVE p \in m..n <=> p \in Int /\ m <= p /\ p <= n
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

    File "./range_test.tla", line 9, character 1 to line 19, character 4:
    [INFO]: All 1 obligation proved.
---*)
