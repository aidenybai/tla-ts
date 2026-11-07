(*---
description: LS4 is another name for the PTL pragma.
ref: src/backend/prep.ml#compute_meth
mode: proof
outcome: proved
---*)
---- MODULE ls4_pragma ----
EXTENDS TLAPS
VARIABLE x
THEOREM [](x = 1) => (x = 1)
  BY LS4
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
    @prover: ls4
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 2
    @loc: 11:6:11:9
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 11:6:11:9
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./ls4_pragma.tla", line 7, character 1 to line 12, character 4:
    [INFO]: All 2 obligations proved.
---*)
