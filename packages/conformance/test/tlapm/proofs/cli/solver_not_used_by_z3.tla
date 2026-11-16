(*---
description: '--solver replaces only the default SMT solver, so the Z3 pragma still runs Z3 itself.'
ref: src/backend/prep.ml#z3_solve
mode: proof
args: ['--solver', echo sat]
outcome: proved
---*)
---- MODULE solver_not_used_by_z3 ----
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
    @loc: 11:6:11:8
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 11:6:11:8
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./solver_not_used_by_z3.tla", line 8, character 1 to line 12, character 4:
    [INFO]: All 2 obligations proved.
---*)
