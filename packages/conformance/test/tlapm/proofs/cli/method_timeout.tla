(*---
description: '--method name:seconds sets the timeout of that method.'
ref: src/params.ml#parse_default_methods
mode: proof
args: ['--method', zenon:3]
outcome: proved
---*)
---- MODULE method_timeout ----
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
    @meth: time-limit: 3
    @already: false

    @type: obligationsnumber
    @count: 1

    File "./method_timeout.tla", line 8, character 1 to line 12, character 4:
    [INFO]: All 1 obligation proved.
---*)
