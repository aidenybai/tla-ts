(*---
description: '--stretch also scales the timeout a pragma gives.'
ref: src/method.ml#scale_time
mode: proof
args: ['--stretch', '0.5']
outcome: proved
---*)
---- MODULE stretch_scales_pragma ----
EXTENDS Naturals, TLAPS
THEOREM ASSUME NEW P, NEW Q, P /\ Q PROVE Q /\ P
  BY ZenonT(4)
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
    @prover: zenon
    @meth: time-limit: 2
    @already: false

    @type: obligation
    @id: 2
    @loc: 11:6:11:15
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 11:6:11:15
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./stretch_scales_pragma.tla", line 8, character 1 to line 12, character 4:
    [INFO]: All 2 obligations proved.
---*)
