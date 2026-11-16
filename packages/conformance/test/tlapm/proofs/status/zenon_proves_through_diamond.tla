(*---
description: The action frontend abstracts <> away as an opaque formula, so Zenon proves an implication whose conclusion is TRUE.
ref: src/frontend/action.ml#process_obligation
mode: proof
outcome: proved
---*)
---- MODULE zenon_proves_through_diamond ----
EXTENDS TLAPS
VARIABLE x
THEOREM <>(x = 1) => TRUE
  BY Zenon
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
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 2
    @loc: 11:6:11:11
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 11:6:11:11
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./zenon_proves_through_diamond.tla", line 7, character 1 to line 12, character 4:
    [INFO]: All 2 obligations proved.
---*)
