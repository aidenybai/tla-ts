(*---
description: tlapm's own test unit/g_tuples/tupleapp_test.tla.
ref: test/unit/g_tuples/tupleapp_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE tupleapp_test ----

EXTENDS TLAPS, Integers

THEOREM ASSUME NEW x,
               NEW y
        PROVE /\ << x, y >>[1] = x
              /\ << x, y >>[2] = y
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

    File "./tupleapp_test.tla", line 9, character 1 to line 19, character 4:
    [INFO]: All 1 obligation proved.
---*)
