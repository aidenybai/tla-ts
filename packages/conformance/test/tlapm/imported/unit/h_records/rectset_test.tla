(*---
description: tlapm's own test unit/h_records/rectset_test.tla.
ref: test/unit/h_records/rectset_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE rectset_test ----

EXTENDS TLAPS

THEOREM ASSUME NEW A,
               NEW B,
               NEW r
        PROVE r \in [ foo : A, bar : B ] <=>
                    \E x, y : /\ x \in A
                              /\ y \in B
                              /\ r = [ foo |-> x, bar |-> y ]
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

    File "./rectset_test.tla", line 9, character 1 to line 22, character 4:
    [INFO]: All 1 obligation proved.
---*)
