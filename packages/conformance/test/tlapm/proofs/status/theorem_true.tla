(*---
description: A main obligation is never checked for triviality, so THEOREM TRUE goes to a backend and SMT proves it.
ref: src/backend/prep.ml#trivial
mode: proof
outcome: proved
---*)
---- MODULE theorem_true ----
THEOREM TRUE
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 9:3:9:10
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 9:3:9:10
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligationsnumber
    @count: 1

    File "./theorem_true.tla", line 7, character 1 to line 10, character 4:
    [INFO]: All 1 obligation proved.
---*)
