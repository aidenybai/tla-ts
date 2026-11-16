(*---
description: tlapm's own test unit/g_tuples/productset_test.tla.
ref: test/unit/g_tuples/productset_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE productset_test ----

EXTENDS TLAPS

THEOREM ASSUME NEW A,
               NEW B,
               NEW t
        PROVE t \in A \X B <=>
                \E x, y : /\ x \in A
                          /\ y \in B
                          /\ t = << x, y >>
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

    File "./productset_test.tla", line 9, character 1 to line 22, character 4:
    [INFO]: All 1 obligation proved.
---*)
