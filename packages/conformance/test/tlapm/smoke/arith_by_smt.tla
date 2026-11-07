(*---
description: SMT proves a fact about natural numbers, and the method name itself is a trivial obligation.
mode: proof
outcome: proved
---*)
---- MODULE arith_by_smt ----
EXTENDS Naturals, TLAPS
THEOREM \A x \in Nat : x + 0 = x
  BY SMT
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 9:3:9:5
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 9:3:9:5
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 2
    @loc: 9:6:9:9
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 9:6:9:9
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./arith_by_smt.tla", line 6, character 1 to line 10, character 4:
    [INFO]: All 2 obligations proved.
---*)
