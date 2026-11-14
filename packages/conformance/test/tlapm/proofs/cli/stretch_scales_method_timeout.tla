(*---
description: '--stretch scales a timeout given in --method.'
ref: src/method.ml#scale_time
mode: proof
args: ['--method', zenon:2, '--stretch', '3']
outcome: proved
---*)
---- MODULE stretch_scales_method_timeout ----
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
    @meth: time-limit: 6
    @already: false

    @type: obligationsnumber
    @count: 1

    File "./stretch_scales_method_timeout.tla", line 8, character 1 to line 12, character 4:
    [INFO]: All 1 obligation proved.
---*)
