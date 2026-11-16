(*---
description: An action that no step satisfies is not enabled, so after ExpandENABLED the goal is false and SMT fails.
ref: src/backend/prep.ml#expand_enabled_cdot
mode: proof
outcome: failed
---*)
---- MODULE expand_enabled_unsatisfiable_action ----
EXTENDS TLAPS
VARIABLE x, y
THEOREM ENABLED (x' = 1 /\ x' = 2)
  BY ExpandENABLED, SMTT("r0.01")
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
    @meth: time-limit: inf
    @reason: false
    @already: false
    @obl: 
    (* SMT failed with status = unknown
     *)
    ASSUME NEW VARIABLE x,
           NEW VARIABLE y,
           TRUE ,
           TRUE 
    PROVE  \E x#enabled#prime1 : x#enabled#prime1 = 1 /\ x#enabled#prime1 = 2

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

    @type: obligation
    @id: 3
    @loc: 11:21:11:34
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 11:21:11:34
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 3

    File "./expand_enabled_unsatisfiable_action.tla", line 11, characters 3-4:
    [ERROR]: Could not prove or check:
               ASSUME NEW VARIABLE x,
                      NEW VARIABLE y,
                      ExpandENABLED ,
                      SMTT("r0.01") 
               PROVE  ENABLED (x' = 1 /\ x' = 2)
    File "./expand_enabled_unsatisfiable_action.tla", line 7, character 1 to line 12, character 4:
    [ERROR]: 1/3 obligations failed.
    There were backend errors processing module `"expand_enabled_unsatisfiable_action"`.
---*)
