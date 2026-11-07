(*---
description: Z3T(n) calls Z3 with a limit of n seconds.
ref: src/backend/prep.ml#compute_meth
mode: proof
outcome: proved
---*)
---- MODULE z3t_seconds ----
EXTENDS Naturals, TLAPS
THEOREM \A x \in Nat : x + 0 = x
  BY Z3T(3)
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
    @meth: time-limit: 3
    @already: false

    @type: obligation
    @id: 2
    @loc: 10:6:10:12
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 10:6:10:12
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./z3t_seconds.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 2 obligations proved.
---*)
