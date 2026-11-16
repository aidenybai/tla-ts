(*---
description: The prover name ls4 calls LS4 with its default limit.
ref: src/backend/prep.ml#compute_meth
mode: proof
outcome: proved
---*)
---- MODULE prover_ls4_name ----
EXTENDS TLAPS
VARIABLE x
Mine == TRUE (*{ by (prover:"ls4") }*)
THEOREM [](x = 1) => (x = 1)
  BY Mine
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
    @prover: ls4
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 2
    @loc: 12:6:12:10
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 12:6:12:10
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./prover_ls4_name.tla", line 7, character 1 to line 13, character 4:
    [INFO]: All 2 obligations proved.
---*)
