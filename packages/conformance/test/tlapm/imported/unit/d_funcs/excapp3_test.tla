(*---
description: tlapm's own test unit/d_funcs/excapp3_test.tla.
ref: test/unit/d_funcs/excapp3_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE excapp3_test ----

EXTENDS TLAPS

THEOREM ASSUME NEW A,
               NEW B,
               NEW f \in [ A -> B ],
               NEW x \in A,
               NEW y \in A,
               x # y,
               NEW a,
               NEW b
        PROVE LET g == [ f EXCEPT ![x] = a, ![y] = b ] IN
              g[x] = a
    OBVIOUS

====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 23:5:23:12
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 23:5:23:12
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligationsnumber
    @count: 1

    File "./excapp3_test.tla", line 9, character 1 to line 25, character 4:
    [INFO]: All 1 obligation proved.
---*)
