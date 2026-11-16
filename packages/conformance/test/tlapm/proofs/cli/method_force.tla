(*---
description: '--method force runs Isabelle with the force tactic.'
ref: src/params.ml#parse_default_methods
mode: proof
args: ['--method', force]
outcome: proved
---*)
---- MODULE method_force ----
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
    @prover: isabelle
    @meth: force; time-limit: 30
    @already: false

    @type: obligationsnumber
    @count: 1

    File "./method_force.tla", line 8, character 1 to line 12, character 4:
    [INFO]: All 1 obligation proved.
---*)
