(*---
description: SimpleArithmetic is the historical name of the SMT pragma and runs the SMT solver.
ref: src/backend/prep.ml#compute_meth
mode: proof
outcome: proved
---*)
---- MODULE simple_arithmetic ----
EXTENDS Naturals, TLAPS
THEOREM \A x \in Nat : x + 0 = x
  BY SimpleArithmetic
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
    @loc: 10:6:10:22
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 10:6:10:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./simple_arithmetic.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 2 obligations proved.
---*)
