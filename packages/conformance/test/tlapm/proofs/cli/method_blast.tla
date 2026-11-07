(*---
description: '--method blast runs Isabelle with the blast tactic.'
ref: src/params.ml#parse_default_methods
mode: proof
args: ['--method', blast]
outcome: proved
---*)
---- MODULE method_blast ----
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
    @meth: blast; time-limit: 30
    @already: false

    @type: obligationsnumber
    @count: 1

    File "./method_blast.tla", line 8, character 1 to line 12, character 4:
    [INFO]: All 1 obligation proved.
---*)
