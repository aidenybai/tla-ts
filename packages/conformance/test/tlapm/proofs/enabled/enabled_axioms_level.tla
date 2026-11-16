(*---
description: ENABLEDaxioms refuses an obligation whose assumptions have expression level above 1.
ref: src/backend/prep.ml#expand_enabled_cdot
mode: proof
outcome: failed
---*)
---- MODULE enabled_axioms_level ----
EXTENDS TLAPS
VARIABLE x, y
THEOREM ASSUME NEW ACTION B, NEW ACTION C, B <=> C PROVE ENABLED B <=> ENABLED C
  BY ENABLEDaxioms
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
    @prover: enabledaxioms
    @meth: time-limit: inf
    @reason: ENABLEDaxioms depends on assumptions of level > 1
    @already: false
    @obl: ENABLEDaxioms depends on assumptions of level > 1 


    Obligation:

    ASSUME NEW VARIABLE x,
           NEW VARIABLE y,
           NEW ACTION B,
           NEW ACTION C,
           B <=> C ,
           TRUE 
    PROVE  ENABLED B <=> ENABLED C

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

    expr has ENABLEDaxioms property ===
    File "./enabled_axioms_level.tla", line 11, characters 3-4:
    Error: ENABLEDaxioms depends on assumption of expression level > 1
    File "./enabled_axioms_level.tla", line 11, characters 3-4:
    [ERROR]: Could not prove or check:
               ASSUME NEW VARIABLE x,
                      NEW VARIABLE y,
                      NEW ACTION B,
                      NEW ACTION C,
                      B <=> C ,
                      ENABLEDaxioms 
               PROVE  ENABLED B <=> ENABLED C
    File "./enabled_axioms_level.tla", line 7, character 1 to line 12, character 4:
    [ERROR]: 1/2 obligations failed.
    There were backend errors processing module `"enabled_axioms_level"`.
---*)
