(*---
description: LS4T(n) runs LS4 with a limit of n seconds.
ref: src/backend/prep.ml#compute_meth
mode: proof
outcome: proved
---*)
---- MODULE ls4t_seconds ----
EXTENDS TLAPS
VARIABLE x
THEOREM [](x = 1) => (x = 1)
  BY LS4T(4)
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
    @meth: time-limit: 4
    @already: false

    @type: obligation
    @id: 2
    @loc: 11:6:11:13
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 11:6:11:13
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./ls4t_seconds.tla", line 7, character 1 to line 12, character 4:
    [INFO]: All 2 obligations proved.
---*)
