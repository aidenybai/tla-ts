(*---
description: When Isabelle's tactic does not prove the goal, the obligation fails with reason false.
ref: src/backend/prep.ml#isabelle_prove
mode: proof
outcome: failed
---*)
---- MODULE isabelle_fails ----
EXTENDS TLAPS
THEOREM ASSUME NEW a, NEW b PROVE a = b
  BY Isa
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
    @prover: isabelle
    @meth: auto; time-limit: 30
    @reason: false
    @already: false
    @obl: 
    ASSUME NEW CONSTANT a,
           NEW CONSTANT b,
           TRUE 
    PROVE  a = b

    @type: obligation
    @id: 2
    @loc: 10:6:10:9
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 10:6:10:9
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./isabelle_fails.tla", line 10, characters 3-4:
    [ERROR]: Could not prove or check:
               ASSUME NEW CONSTANT a,
                      NEW CONSTANT b,
                      Isa 
               PROVE  a = b
    File "./isabelle_fails.tla", line 7, character 1 to line 11, character 4:
    [ERROR]: 1/2 obligations failed.
    There were backend errors processing module `"isabelle_fails"`.
---*)
