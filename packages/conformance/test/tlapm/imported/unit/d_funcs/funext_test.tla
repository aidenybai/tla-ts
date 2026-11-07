(*---
description: tlapm's own test unit/d_funcs/funext_test.tla.
ref: test/unit/d_funcs/funext_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE funext_test ----

EXTENDS TLAPS

THEOREM ASSUME NEW A,
               NEW B,
               NEW C,
               NEW f \in [ A -> B ],
               NEW g \in [ A -> C ],
               \A x \in A : f[x] = g[x]
        PROVE f = g
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

    File "./funext_test.tla", line 9, character 1 to line 22, character 4:
    [INFO]: All 1 obligation proved.
---*)
