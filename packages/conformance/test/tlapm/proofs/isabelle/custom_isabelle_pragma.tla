(*---
description: A pragma definition may name the Isabelle prover with its own tactic and timeout.
ref: src/backend/prep.ml#compute_meth
mode: proof
outcome: proved
---*)
---- MODULE custom_isabelle_pragma ----
EXTENDS TLAPS
Mine == TRUE (*{ by (prover:"isabelle"; tactic:"blast"; timeout:33) }*)
THEOREM ASSUME NEW P, NEW Q, P /\ Q PROVE Q /\ P
  BY Mine
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
    @prover: isabelle
    @meth: blast; time-limit: 33
    @already: false

    @type: obligation
    @id: 2
    @loc: 11:6:11:10
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 11:6:11:10
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./custom_isabelle_pragma.tla", line 7, character 1 to line 12, character 4:
    [INFO]: All 2 obligations proved.
---*)
