(*---
description: The SPASS success marker in the solver's output counts as unsat.
ref: src/backend/prep.ml#gen_smt_solve
mode: proof
args: ['--solver', 'echo ''SPASS beiseite: Proof found''']
outcome: proved
---*)
---- MODULE solver_spass_marker_proves ----
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

    File "./solver_spass_marker_proves.tla", line 8, character 1 to line 12, character 4:
    [INFO]: All 1 obligation proved.
---*)
