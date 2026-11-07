(*---
description: The solver command reads the SMT-LIB input from $file.
ref: src/params.ml#solve_cmd
mode: proof
args: ['--solver', grep -q '(check-sat)' "$file" && echo unsat]
outcome: proved
---*)
---- MODULE solver_reads_file ----
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

    File "./solver_reads_file.tla", line 8, character 1 to line 12, character 4:
    [INFO]: All 1 obligation proved.
---*)
