(*---
description: tlapm's own test bugs/hidedef_test.tla, which checks stderr status:failed.
ref: test/bugs/hidedef_test.tla
features:
  - tlapm-test
mode: proof
outcome: failed
---*)
---- MODULE hidedef_test ----

EXTENDS TLAPS

C == TRUE
HIDE DEF C

THEOREM C
    OBVIOUS

====

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 17:5:17:12
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 17:5:17:12
    @status: failed
    @prover: isabelle
    @meth: auto; time-limit: 30
    @reason: false
    @already: false
    @obl: 
    C

    @type: obligationsnumber
    @count: 1

    Zenon error: exhausted search space without finding a proof
    File "./hidedef_test.tla", line 17, characters 5-11:
    [ERROR]: Could not prove or check:
               C
    File "./hidedef_test.tla", line 9, character 1 to line 19, character 4:
    [ERROR]: 1/1 obligation failed.
    There were backend errors processing module `"hidedef_test"`.
---*)
