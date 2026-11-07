(*---
description: tlapm's own test fast/basic/z3_false_test.tla, which checks stderr reason:false.
ref: test/fast/basic/z3_false_test.tla
features:
  - tlapm-test
mode: proof
outcome: failed
---*)
---- MODULE z3_false_test ----

EXTENDS TLAPS

THEOREM t == FALSE BY Z3

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
    @prover: z3
    @meth: time-limit: 5
    @reason: false
    @already: false
    @obl: 
    (* SMT failed with status = sat
     *)
    ASSUME TRUE 
    PROVE  FALSE

    @type: obligation
    @id: 2
    @loc: 13:23:13:25
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 13:23:13:25
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./z3_false_test.tla", line 13, characters 20-21:
    [ERROR]: Could not prove or check:
               ASSUME Z3 
               PROVE  FALSE
    File "./z3_false_test.tla", line 9, character 1 to line 15, character 4:
    [ERROR]: 1/2 obligations failed.
    There were backend errors processing module `"z3_false_test"`.
---*)
