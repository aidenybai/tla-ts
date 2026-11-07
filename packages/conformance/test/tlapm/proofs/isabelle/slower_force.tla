(*---
description: SlowerForce runs force with a 480 second limit.
ref: src/backend/prep.ml#compute_meth
mode: proof
outcome: proved
---*)
---- MODULE slower_force ----
EXTENDS TLAPS
THEOREM ASSUME NEW P, NEW Q, P /\ Q PROVE Q /\ P
  BY SlowerForce
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
    @meth: force; time-limit: 480
    @already: false

    @type: obligation
    @id: 2
    @loc: 10:6:10:17
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 10:6:10:17
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./slower_force.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 2 obligations proved.
---*)
