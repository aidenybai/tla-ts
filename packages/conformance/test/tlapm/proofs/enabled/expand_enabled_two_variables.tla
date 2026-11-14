(*---
description: ExpandENABLED quantifies over every primed variable, so an action on two variables becomes provable.
ref: src/backend/prep.ml#expand_enabled_cdot
mode: proof
outcome: proved
---*)
---- MODULE expand_enabled_two_variables ----
EXTENDS TLAPS
VARIABLE x, y
THEOREM ENABLED (x' = 1 /\ y' = x)
  BY ExpandENABLED
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
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 2
    @loc: 11:6:11:19
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 11:6:11:19
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./expand_enabled_two_variables.tla", line 7, character 1 to line 12, character 4:
    [INFO]: All 2 obligations proved.
---*)
