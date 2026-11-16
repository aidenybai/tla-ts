(*---
description: AllIsa tries Isabelle tactics in turn and stops at the first, auto, that proves the goal.
ref: src/backend/prep.ml#compute_meth
mode: proof
outcome: proved
---*)
---- MODULE all_isa ----
EXTENDS TLAPS
THEOREM ASSUME NEW P, NEW Q, P /\ Q PROVE Q /\ P
  BY AllIsa
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
    @prover: isabelle
    @meth: auto; time-limit: 30
    @already: false

    @type: obligation
    @id: 2
    @loc: 10:6:10:12
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 10:6:10:12
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./all_isa.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 2 obligations proved.
---*)
