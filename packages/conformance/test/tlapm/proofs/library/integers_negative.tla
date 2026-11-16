(*---
description: With Integers, SMT proves facts about negative numbers.
ref: src/encode/n_axiomatize.ml#main
mode: proof
outcome: proved
---*)
---- MODULE integers_negative ----
EXTENDS Integers, TLAPS
THEOREM \A n \in Int : n < 0 => -n \in Nat
  BY SMT
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 10:3:10:5
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 10:3:10:5
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 2
    @loc: 10:6:10:9
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 10:6:10:9
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./integers_negative.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 2 obligations proved.
---*)
