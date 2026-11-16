(*---
description: tlapm's own test unit/d_funcs/excapp2_test.tla.
ref: test/unit/d_funcs/excapp2_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE excapp_test ----

EXTENDS TLAPS

THEOREM ASSUME NEW A,
               NEW B,
               NEW f \in [ A -> B ],
               NEW x \in A,
               NEW a,
               NEW y \in A,
               y # x
        PROVE LET g == [ f EXCEPT ![x] = a ] IN
              g[y] = f[y]
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

    @type: warning
    @msg: File "./excapp2_test.tla", line 9, character 1 to line 24, character 4 :
    Warning: module name "excapp_test" does not match file name "excapp2_test.tla".

    @type: obligationsnumber
    @count: 1

    File "./excapp2_test.tla", line 9, character 1 to line 24, character 4:
    [INFO]: All 1 obligation proved.
---*)
