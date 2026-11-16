(*---
description: The Trivial backend reports success without recording a result, so a main obligation it handles is reported at the end as failed by prover fail with reason unexpected error.
ref: src/backend/prep.ml#prove_with
mode: proof
outcome: failed
---*)
---- MODULE trivial_pragma_nontrivial_goal ----
EXTENDS Naturals, TLAPS
THEOREM ASSUME NEW P, NEW Q, P /\ Q PROVE Q /\ P
  BY ONLY Trivial
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 10:3:10:5
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 10:3:10:5
    @status: failed
    @prover: fail
    @meth: time-limit: inf
    @reason: unexpected error
    @already: false
    @obl: ASSUME NEW CONSTANT P,
           NEW CONSTANT Q,
           Trivial 
    PROVE  Q /\ P

    @type: obligation
    @id: 2
    @loc: 10:11:10:18
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 10:11:10:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./trivial_pragma_nontrivial_goal.tla", line 10, characters 3-4:
    [ERROR]: Could not prove or check:
               ASSUME NEW CONSTANT P,
                      NEW CONSTANT Q,
                      Trivial 
               PROVE  Q /\ P
    File "./trivial_pragma_nontrivial_goal.tla", line 7, character 1 to line 11, character 4:
    [ERROR]: 1/2 obligations failed.
    There were backend errors processing module `"trivial_pragma_nontrivial_goal"`.
---*)
