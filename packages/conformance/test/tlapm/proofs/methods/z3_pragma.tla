(*---
description: Z3 calls Z3 directly as prover z3, not through the default SMT solver, with a 5 second limit.
ref: src/backend/prep.ml#compute_meth
mode: proof
outcome: proved
---*)
---- MODULE z3_pragma ----
EXTENDS Naturals, TLAPS
THEOREM \A x \in Nat : x + 0 = x
  BY Z3
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
    @prover: z3
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 2
    @loc: 10:6:10:8
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 10:6:10:8
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./z3_pragma.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 2 obligations proved.
---*)
