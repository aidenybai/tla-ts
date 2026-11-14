(*---
description: IsaM(tactic) runs Isabelle with the given tactic.
ref: src/backend/prep.ml#compute_meth
mode: proof
outcome: proved
---*)
---- MODULE isam ----
EXTENDS TLAPS
THEOREM ASSUME NEW P, NEW Q, P /\ Q PROVE Q /\ P
  BY IsaM("blast")
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
    @meth: blast; time-limit: 30
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

    File "./isam.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 2 obligations proved.
---*)
