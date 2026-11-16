(*---
description: AutoUSE lets ExpandENABLED expand the hidden definition itself, and tlapm logs which operator it expanded.
ref: src/expr/e_action.ml#expand_definition
mode: proof
outcome: proved
---*)
---- MODULE expand_enabled_autouse ----
EXTENDS TLAPS
VARIABLE x, y
A == x' = 1
THEOREM ENABLED A
  BY ExpandENABLED, AutoUSE
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

    @type: obligation
    @id: 3
    @loc: 12:21:12:28
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 12:21:12:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 3

    File "./expand_enabled_autouse.tla", line 11, character 17:
    [INFO]: Auto-expanding the definition of operator:  A
    File "./expand_enabled_autouse.tla", line 7, character 1 to line 13, character 4:
    [INFO]: All 3 obligations proved.
---*)
