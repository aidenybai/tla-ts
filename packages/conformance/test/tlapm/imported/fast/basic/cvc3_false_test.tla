(*---
description: tlapm's own test fast/basic/cvc3_false_test.tla, which checks stderr status:failed.
ref: test/fast/basic/cvc3_false_test.tla
features:
  - tlapm-test
mode: proof
outcome: failed
---*)
---- MODULE cvc3_false_test ----

EXTENDS TLAPS

THEOREM t == FALSE BY CVC3T(35)

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
    @prover: cvc4
    @meth: time-limit: 35
    @reason: Executable "cvc4" not found in this PATH:
    <PATH>
    @already: false
    @obl: 
    ASSUME TRUE 
    PROVE  FALSE

    @type: obligation
    @id: 2
    @loc: 13:23:13:32
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 13:23:13:32
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    sh: line 0: type: cvc4: not found
    Executable "cvc4" not found in this PATH:
    <PATH>
    File "./cvc3_false_test.tla", line 13, characters 20-21:
    [ERROR]: Could not prove or check:
               ASSUME CVC3T(35) 
               PROVE  FALSE
    File "./cvc3_false_test.tla", line 9, character 1 to line 15, character 4:
    [ERROR]: 1/2 obligations failed.
    There were backend errors processing module `"cvc3_false_test"`.
---*)
