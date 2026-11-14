(*---
description: tlapm's own test regression_tests/function_except_tuple_soundness_gh201_test.tla, which checks stderr status:failed.
ref: test/regression_tests/function_except_tuple_soundness_gh201_test.tla
features:
  - tlapm-test
mode: proof
outcome: failed
---*)
---- MODULE function_except_tuple_soundness_gh201_test ----
EXTENDS TLAPS, Naturals

THEOREM SoundnessError == FALSE
  <1> DEFINE f1 == [i \in Nat |-> i]
  <1> DEFINE f2 == [f1 EXCEPT ![0] = << 0 >>]
  <1>1. f1 = f2 OBVIOUS
  <1> QED BY <1>1

====

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 16:11:16:13
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 16:11:16:13
    @status: failed
    @prover: isabelle
    @meth: auto; time-limit: 30
    @reason: false
    @already: false
    @obl: 
    ASSUME [i \in Nat |-> i] = [[i \in Nat |-> i] EXCEPT ![0] = <<0>>] 
    PROVE  FALSE

    @type: obligation
    @id: 2
    @loc: 16:14:16:18
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 16:14:16:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 3
    @loc: 15:17:15:24
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 15:17:15:24
    @status: failed
    @prover: isabelle
    @meth: auto; time-limit: 30
    @reason: false
    @already: false
    @obl: 
    [i \in Nat |-> i] = [[i \in Nat |-> i] EXCEPT ![0] = <<0>>]

    @type: obligationsnumber
    @count: 3

    Zenon error: exhausted search space without finding a proof
    File "./function_except_tuple_soundness_gh201_test.tla", line 15, characters 17-23:
    [ERROR]: Could not prove or check:
               ASSUME f1 == [i \in Nat |-> i],
                      f2 == [f1 EXCEPT !
                                       [0] = <<0>>]
               PROVE  f1 = f2
    File "./function_except_tuple_soundness_gh201_test.tla", line 16, characters 11-12:
    [ERROR]: Could not prove or check:
               ASSUME f1 == [i \in Nat |-> i],
                      f2 == [f1 EXCEPT !
                                       [0] = <<0>>],
                      <1>1 
               PROVE  FALSE
    File "./function_except_tuple_soundness_gh201_test.tla", line 9, character 1 to line 18, character 4:
    [ERROR]: 2/3 obligations failed.
    There were backend errors processing module `"function_except_tuple_soundness_gh201_test"`.
---*)
