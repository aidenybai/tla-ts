(*---
description: Without ExpandENABLED, ENABLED reaches SMT as an opaque formula, so Z3 finds the negated goal satisfiable.
ref: src/frontend/action.ml#process_obligation
mode: proof
outcome: failed
---*)
---- MODULE enabled_opaque_without_pragma ----
EXTENDS TLAPS
VARIABLE x, y
THEOREM ENABLED (x' = 1)
  BY SMT
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
    @reason: false
    @already: false
    @obl: 
    (* SMT failed with status = sat
     *)
    ASSUME NEW VARIABLE x,
           NEW VARIABLE y,
           TRUE 
    PROVE  ENABLED (x' = 1)

    @type: obligation
    @id: 2
    @loc: 11:6:11:9
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 11:6:11:9
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./enabled_opaque_without_pragma.tla", line 11, characters 3-4:
    [ERROR]: Could not prove or check:
               ASSUME NEW VARIABLE x,
                      NEW VARIABLE y,
                      SMT 
               PROVE  ENABLED (x' = 1)
    File "./enabled_opaque_without_pragma.tla", line 7, character 1 to line 12, character 4:
    [ERROR]: 1/2 obligations failed.
    There were backend errors processing module `"enabled_opaque_without_pragma"`.
---*)
