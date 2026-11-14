(*---
description: The prover name smt2z3 is an alias of Z3.
ref: src/backend/prep.ml#compute_meth
mode: proof
outcome: proved
---*)
---- MODULE prover_smt2z3 ----
EXTENDS Naturals, TLAPS
Mine == TRUE (*{ by (prover:"smt2z3") }*)
THEOREM \A x \in Nat : x + 0 = x
  BY Mine
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 11:3:11:5
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 11:3:11:5
    @status: proved
    @prover: z3
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 2
    @loc: 11:6:11:10
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 11:6:11:10
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./prover_smt2z3.tla", line 7, character 1 to line 12, character 4:
    [INFO]: All 2 obligations proved.
---*)
