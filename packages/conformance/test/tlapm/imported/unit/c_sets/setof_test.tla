(*---
description: tlapm's own test unit/c_sets/setof_test.tla.
ref: test/unit/c_sets/setof_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE setof_test ----

EXTENDS TLAPS

THEOREM ASSUME NEW a,
               NEW F(_)
        PROVE \A x : x \in { F(y) : y \in a } <=> \E y : y \in a /\ x = F(y)
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

    File "./setof_test.tla", line 9, character 1 to line 18, character 4:
    [INFO]: All 1 obligation proved.
---*)
