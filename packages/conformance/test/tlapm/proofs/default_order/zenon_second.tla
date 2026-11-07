(*---
description: When the default SMT solver fails, tlapm tries Zenon next, and Zenon proves the goal.
ref: src/params.ml#default_method
mode: proof
args: ['--solver', echo unknown]
outcome: proved
---*)
---- MODULE zenon_second ----
EXTENDS Naturals
THEOREM ASSUME NEW P, NEW Q, P /\ Q PROVE Q /\ P
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 11:3:11:10
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 11:3:11:10
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligationsnumber
    @count: 1

    File "./zenon_second.tla", line 8, character 1 to line 12, character 4:
    [INFO]: All 1 obligation proved.
---*)
