(*---
description: Expanding the definition with DEF lets ExpandENABLED proceed without AutoUSE.
ref: src/backend/prep.ml#expand_enabled_cdot
mode: proof
outcome: proved
---*)
---- MODULE expand_enabled_by_def ----
EXTENDS TLAPS
VARIABLE x, y
A == x' = 1
THEOREM ENABLED A
  BY ExpandENABLED DEF A
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 12:3:12:5
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 12:3:12:5
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 2
    @loc: 12:6:12:19
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 12:6:12:19
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./expand_enabled_by_def.tla", line 7, character 1 to line 13, character 4:
    [INFO]: All 2 obligations proved.
---*)
