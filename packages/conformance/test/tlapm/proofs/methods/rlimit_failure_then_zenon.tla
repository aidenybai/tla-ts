(*---
description: When the first pragma's SMT run gives up within its rlimit budget, the next pragma's backend runs and Zenon proves the goal.
ref: src/backend/schedule.ml#start_process
mode: proof
outcome: proved
---*)
---- MODULE rlimit_failure_then_zenon ----
EXTENDS Naturals, TLAPS
THEOREM ASSUME NEW P, NEW Q, P /\ Q PROVE Q /\ P
  BY SMTT("r0.0000001"), Zenon
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
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 2
    @loc: 10:6:10:24
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 10:6:10:24
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 3
    @loc: 10:26:10:31
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 10:26:10:31
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 3

    File "./rlimit_failure_then_zenon.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 3 obligations proved.
---*)
