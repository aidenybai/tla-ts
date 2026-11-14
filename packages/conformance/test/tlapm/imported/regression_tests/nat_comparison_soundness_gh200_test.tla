(*---
description: tlapm's own test regression_tests/nat_comparison_soundness_gh200_test.tla, which checks stderr status:failed.
ref: test/regression_tests/nat_comparison_soundness_gh200_test.tla
features:
  - tlapm-test
mode: proof
outcome: failed
---*)
---- MODULE nat_comparison_soundness_gh200_test ----
EXTENDS TLAPS, Naturals

THEOREM SoundnessError == FALSE
  <1> DEFINE Elt == CHOOSE x \in Nat : TRUE
  <1>1. Nat = {Elt} OBVIOUS
  <1>2. 0 \in Nat /\ 1 \in Nat /\ 0 # 1 OBVIOUS
  <1>3. FALSE BY <1>1, <1>2, Zenon
  <1> QED BY <1>3

====

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 17:11:17:13
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 17:11:17:13
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 2
    @loc: 17:14:17:18
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 17:14:17:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 3
    @loc: 14:21:14:28
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 14:21:14:28
    @status: failed
    @prover: isabelle
    @meth: auto; time-limit: 30
    @reason: false
    @already: false
    @obl: 
    Nat = {CHOOSE x \in Nat : TRUE}

    @type: obligation
    @id: 4
    @loc: 15:41:15:48
    @status: to be proved

    @type: obligation
    @id: 4
    @loc: 15:41:15:48
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 5
    @loc: 16:15:16:17
    @status: to be proved

    @type: obligation
    @id: 5
    @loc: 16:15:16:17
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 6
    @loc: 16:18:16:22
    @status: to be proved

    @type: obligation
    @id: 6
    @loc: 16:18:16:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 7
    @loc: 16:24:16:28
    @status: to be proved

    @type: obligation
    @id: 7
    @loc: 16:24:16:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 8
    @loc: 16:30:16:35
    @status: to be proved

    @type: obligation
    @id: 8
    @loc: 16:30:16:35
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 8

    Zenon error: exhausted search space without finding a proof
    File "./nat_comparison_soundness_gh200_test.tla", line 14, characters 21-27:
    [ERROR]: Could not prove or check:
               ASSUME Elt == CHOOSE x \in Nat : TRUE
               PROVE  Nat = {Elt}
    File "./nat_comparison_soundness_gh200_test.tla", line 9, character 1 to line 19, character 4:
    [ERROR]: 1/8 obligations failed.
    There were backend errors processing module `"nat_comparison_soundness_gh200_test"`.
---*)
