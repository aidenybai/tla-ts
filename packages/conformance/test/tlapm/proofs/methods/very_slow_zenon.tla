(*---
description: VerySlowZenon runs Zenon with an 80 second limit.
ref: src/method_prs.ml#isa_zenon
mode: proof
outcome: proved
---*)
---- MODULE very_slow_zenon ----
EXTENDS Naturals, TLAPS
THEOREM ASSUME NEW P, NEW Q, P /\ Q PROVE Q /\ P
  BY VerySlowZenon
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
    @meth: time-limit: 80
    @already: false

    @type: obligation
    @id: 2
    @loc: 10:6:10:19
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 10:6:10:19
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./very_slow_zenon.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 2 obligations proved.
---*)
