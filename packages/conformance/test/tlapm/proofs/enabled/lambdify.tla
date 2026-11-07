(*---
description: Lambdify leaves ENABLED as an EnabledWrapper of a LAMBDA, which type synthesis cannot encode for SMT, so the obligation fails with that message.
ref: src/backend/prep.ml#expand_enabled_cdot
mode: proof
outcome: failed
---*)
---- MODULE lambdify ----
EXTENDS TLAPS
VARIABLE x, y
THEOREM ENABLED (x' = 1)
  BY Lambdify, SMT
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 11:3:11:5
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 11:3:11:5
    @status: failed
    @prover: smt
    @meth: time-limit: 5
    @reason: Type.Synthesize: Unexpected Lambda constructor
    @already: false
    @obl: 
    ASSUME NEW VARIABLE x,
           NEW VARIABLE y,
           TRUE ,
           TRUE 
    PROVE  ?EnabledWrapper(LAMBDA r#0 : r#0 = 1)

    @type: obligation
    @id: 2
    @loc: 11:6:11:14
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 11:6:11:14
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 3
    @loc: 11:16:11:19
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 11:16:11:19
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 3

    File "./lambdify.tla", line 11, characters 3-4:
    [ERROR]: Could not prove or check:
               ASSUME NEW VARIABLE x,
                      NEW VARIABLE y,
                      Lambdify ,
                      SMT 
               PROVE  ENABLED (x' = 1)
    File "./lambdify.tla", line 7, character 1 to line 12, character 4:
    [ERROR]: 1/3 obligations failed.
    There were backend errors processing module `"lambdify"`.
---*)
