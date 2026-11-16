(*---
description: tlapm's own test fast/basic/zen_false_test.tla, which checks stderr status:failed.
ref: test/fast/basic/zen_false_test.tla
features:
  - tlapm-test
mode: proof
outcome: failed
---*)
---- MODULE zen_false_test ----

EXTENDS TLAPS

THEOREM t == FALSE BY ZenonT (5)

====

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 13:20:13:22
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 13:20:13:22
    @status: failed
    @prover: zenon
    @meth: time-limit: 5
    @reason: false
    @already: false
    @obl: 
    ASSUME TRUE 
    PROVE  FALSE

    @type: obligation
    @id: 2
    @loc: 13:23:13:33
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 13:23:13:33
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    Zenon error: exhausted search space without finding a proof
    File "./zen_false_test.tla", line 13, characters 20-21:
    [ERROR]: Could not prove or check:
               ASSUME ZenonT(5) 
               PROVE  FALSE
    File "./zen_false_test.tla", line 9, character 1 to line 15, character 4:
    [ERROR]: 1/2 obligations failed.
    There were backend errors processing module `"zen_false_test"`.
---*)
