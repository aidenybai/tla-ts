(*---
description: tlapm's own test unit/d_funcs/excapp4_test.tla.
ref: test/unit/d_funcs/excapp4_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE excapp4_test ----

EXTENDS TLAPS

THEOREM ASSUME NEW A,
               NEW B,
               NEW C,
               NEW f \in [ A -> [ B -> C ] ],
               NEW x \in A,
               NEW y \in B,
               NEW a
        PROVE LET g == [ f EXCEPT ![x][y] = a ] IN
              g[x][y] = a
    OBVIOUS

====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 22:5:22:12
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 22:5:22:12
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligationsnumber
    @count: 1

    File "./excapp4_test.tla", line 9, character 1 to line 24, character 4:
    [INFO]: All 1 obligation proved.
---*)
