(*---
description: tlapm looks for unsat at the start of any line of the solver's output.
ref: src/backend/prep.ml#gen_smt_solve
mode: proof
args: ['--solver', printf 'warning\nunsat\n']
outcome: proved
---*)
---- MODULE solver_unsat_on_later_line ----
EXTENDS Naturals
THEOREM 1 = 2
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 11:3:11:10
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 11:3:11:10
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligationsnumber
    @count: 1

    File "./solver_unsat_on_later_line.tla", line 8, character 1 to line 12, character 4:
    [INFO]: All 1 obligation proved.
---*)
