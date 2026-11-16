(*---
description: ZenonT(n) runs Zenon with a limit of n seconds.
ref: src/backend/prep.ml#compute_meth
mode: proof
outcome: proved
---*)
---- MODULE zenont_seconds ----
EXTENDS Naturals, TLAPS
THEOREM ASSUME NEW P, NEW Q, P /\ Q PROVE Q /\ P
  BY ZenonT(25)
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
    @prover: zenon
    @meth: time-limit: 25
    @already: false

    @type: obligation
    @id: 2
    @loc: 10:6:10:16
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 10:6:10:16
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./zenont_seconds.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 2 obligations proved.
---*)
