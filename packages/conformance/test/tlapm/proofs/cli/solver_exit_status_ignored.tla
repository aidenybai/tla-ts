(*---
description: tlapm reads only the solver's output, so unsat proves even when the solver exits with an error.
ref: src/backend/prep.ml#gen_smt_solve
mode: proof
args: ['--solver', sh -c 'echo unsat; exit 1']
outcome: proved
---*)
---- MODULE solver_exit_status_ignored ----
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

    File "./solver_exit_status_ignored.tla", line 8, character 1 to line 12, character 4:
    [INFO]: All 1 obligation proved.
---*)
