(*---
description: tlapm's own test unit/g_tuples/tupleext_test.tla.
ref: test/unit/g_tuples/tupleext_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE tupleext_test ----

EXTENDS TLAPS

THEOREM ASSUME NEW x,
               NEW y,
               NEW u,
               NEW v
        PROVE << x, y >> = << u, v >>
                    <=> /\ x = u
                        /\ y = v
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

    File "./tupleext_test.tla", line 9, character 1 to line 22, character 4:
    [INFO]: All 1 obligation proved.
---*)
