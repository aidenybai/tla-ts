(*---
description: AllIsaT(n) gives every Isabelle tactic it tries a limit of n seconds.
ref: src/backend/prep.ml#compute_meth
mode: proof
outcome: proved
---*)
---- MODULE all_isat ----
EXTENDS TLAPS
THEOREM ASSUME NEW P, NEW Q, P /\ Q PROVE Q /\ P
  BY AllIsaT(40)
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
    @meth: auto; time-limit: 40
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

    File "./all_isat.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 2 obligations proved.
---*)
