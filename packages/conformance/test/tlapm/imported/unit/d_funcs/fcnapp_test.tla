(*---
description: tlapm's own test unit/d_funcs/fcnapp_test.tla.
ref: test/unit/d_funcs/fcnapp_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE fcnapp_test ----

EXTENDS TLAPS

THEOREM ASSUME NEW A,
               NEW F(_),
               NEW z
        PROVE z \in A => [ x \in A |-> F(x) ][z] = F(z)
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

    File "./fcnapp_test.tla", line 9, character 1 to line 19, character 4:
    [INFO]: All 1 obligation proved.
---*)
