(*---
description: A second obligation with the same fingerprint reuses the first result and is reported with already true.
ref: src/backend/prep.ml#already_processed
mode: proof
outcome: proved
---*)
---- MODULE already_proved_in_run ----
EXTENDS Naturals, TLAPS
THEOREM 1 + 1 = 2
  BY Z3
THEOREM 1 + 1 = 2
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

    @type: obligation
    @id: 3
    @loc: 12:3:12:5
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 12:3:12:5
    @status: proved
    @prover: z3
    @meth: time-limit: 5
    @already: true

    @type: obligation
    @id: 4
    @loc: 12:6:12:8
    @status: to be proved

    @type: obligation
    @id: 4
    @loc: 12:6:12:8
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 4

    File "./already_proved_in_run.tla", line 7, character 1 to line 13, character 4:
    [INFO]: All 4 obligations proved.
---*)
