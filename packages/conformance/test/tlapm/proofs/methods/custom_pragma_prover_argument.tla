(*---
description: With prover:@ the prover name comes from the pragma's string argument.
ref: src/backend/prep.ml#compute_meth
mode: proof
outcome: proved
---*)
---- MODULE custom_pragma_prover_argument ----
EXTENDS Naturals, TLAPS
With(P) == TRUE (*{ by (prover:@) }*)
THEOREM ASSUME NEW P, NEW Q, P /\ Q PROVE Q /\ P
  BY With("zenon")
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
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 2
    @loc: 11:6:11:19
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 11:6:11:19
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./custom_pragma_prover_argument.tla", line 7, character 1 to line 12, character 4:
    [INFO]: All 2 obligations proved.
---*)
