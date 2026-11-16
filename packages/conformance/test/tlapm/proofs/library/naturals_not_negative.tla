(*---
description: With Naturals, -1 is not available, but 0 - 1 is not a natural number.
ref: src/encode/n_axiomatize.ml#main
mode: proof
outcome: proved
---*)
---- MODULE naturals_not_negative ----
EXTENDS Naturals, TLAPS
THEOREM 0 - 1 \notin Nat
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

    File "./naturals_not_negative.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 2 obligations proved.
---*)
