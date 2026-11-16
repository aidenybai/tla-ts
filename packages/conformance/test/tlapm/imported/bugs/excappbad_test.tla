(*---
description: tlapm's own test bugs/excappbad_test.tla, which checks stderr status:failed.
ref: test/bugs/excappbad_test.tla
features:
  - tlapm-test
mode: proof
outcome: failed
---*)
---- MODULE excapp3_test ----

EXTENDS TLAPS

THEOREM ASSUME NEW A,
               NEW B,
               NEW f \in [ A -> B ],
               NEW x \in A,
               NEW y \in A,
               NEW a,
               NEW b
        PROVE LET g == [ f EXCEPT ![x] = a, ![y] = b ] IN
              g[x] = a
    OBVIOUS

====

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 22:5:22:12
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 22:5:22:12
    @status: failed
    @prover: isabelle
    @meth: auto; time-limit: 30
    @reason: false
    @already: false
    @obl: 
    ASSUME NEW CONSTANT A,
           NEW CONSTANT B,
           NEW CONSTANT f \in [A -> B],
           NEW CONSTANT x \in A,
           NEW CONSTANT y \in A,
           NEW CONSTANT a,
           NEW CONSTANT b
    PROVE  [[f EXCEPT ![x] = a] EXCEPT ![y] = b][x] = a

    @type: warning
    @msg: File "./excappbad_test.tla", line 9, character 1 to line 24, character 4 :
    Warning: module name "excapp3_test" does not match file name "excappbad_test.tla".

    @type: obligationsnumber
    @count: 1

    Zenon error: exhausted search space without finding a proof
    File "./excappbad_test.tla", line 22, characters 5-11:
    [ERROR]: Could not prove or check:
               ASSUME NEW CONSTANT A,
                      NEW CONSTANT B,
                      NEW CONSTANT f \in 
                      [A -> B],
                      NEW CONSTANT x \in A,
                      NEW CONSTANT y \in A,
                      NEW CONSTANT a,
                      NEW CONSTANT b
               PROVE  LET g == [[f EXCEPT !
                                       [x] = a] EXCEPT !
                                       [y] = b]
                      IN  g[x] = a
    File "./excappbad_test.tla", line 9, character 1 to line 24, character 4:
    [ERROR]: 1/1 obligation failed.
    There were backend errors processing module `"excappbad_test"`.
---*)
