(*---
description: When Zenon exhausts its search space it prints an error and the obligation fails with reason false.
ref: src/backend/prep.ml#zenon_prove
mode: proof
outcome: failed
---*)
---- MODULE zenon_exhausted ----
EXTENDS TLAPS
THEOREM ASSUME NEW a, NEW b PROVE a = b
  BY Zenon
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 10:3:10:5
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 10:3:10:5
    @status: failed
    @prover: zenon
    @meth: time-limit: 10
    @reason: false
    @already: false
    @obl: 
    ASSUME NEW CONSTANT a,
           NEW CONSTANT b,
           TRUE 
    PROVE  a = b

    @type: obligation
    @id: 2
    @loc: 10:6:10:11
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 10:6:10:11
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    Zenon error: exhausted search space without finding a proof
    File "./zenon_exhausted.tla", line 10, characters 3-4:
    [ERROR]: Could not prove or check:
               ASSUME NEW CONSTANT a,
                      NEW CONSTANT b,
                      Zenon 
               PROVE  a = b
    File "./zenon_exhausted.tla", line 7, character 1 to line 11, character 4:
    [ERROR]: 1/2 obligations failed.
    There were backend errors processing module `"zenon_exhausted"`.
---*)
