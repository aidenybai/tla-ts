(*---
description: Z3T("rN") calls Z3 with an rlimit budget and an infinite time limit.
ref: src/backend/prep.ml#compute_meth
mode: proof
outcome: proved
---*)
---- MODULE z3t_rlimit ----
EXTENDS Naturals, TLAPS
THEOREM \A x \in Nat : x + 0 = x
  BY Z3T("r1")
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
    @meth: time-limit: inf
    @already: false

    @type: obligation
    @id: 2
    @loc: 10:6:10:15
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 10:6:10:15
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./z3t_rlimit.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 2 obligations proved.
---*)
