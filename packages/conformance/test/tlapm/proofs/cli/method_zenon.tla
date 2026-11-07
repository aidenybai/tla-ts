(*---
description: '--method zenon replaces the default methods by Zenon alone.'
ref: src/params.ml#parse_default_methods
mode: proof
args: ['--method', zenon]
outcome: proved
---*)
---- MODULE method_zenon ----
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

    File "./method_zenon.tla", line 8, character 1 to line 12, character 4:
    [INFO]: All 1 obligation proved.
---*)
