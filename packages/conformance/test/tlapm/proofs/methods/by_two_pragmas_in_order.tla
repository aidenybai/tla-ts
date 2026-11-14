(*---
description: Two pragmas in one BY are both tried, in the order they appear, so Zenon fails and SMT proves the arithmetic fact.
ref: src/backend/prep.ml#find_meth
mode: proof
outcome: proved
---*)
---- MODULE by_two_pragmas_in_order ----
EXTENDS Naturals, TLAPS
THEOREM \A x \in Nat : x + 0 = x
  BY Zenon, SMT
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
    @loc: 10:6:10:11
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 10:6:10:11
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 3
    @loc: 10:13:10:16
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 10:13:10:16
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 3

    Zenon error: exhausted search space without finding a proof
    File "./by_two_pragmas_in_order.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 3 obligations proved.
---*)
