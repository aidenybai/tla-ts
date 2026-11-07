(*---
description: When Z3 finds the negated goal satisfiable, the obligation fails with reason false and tlapm prepends the sat status to the obligation.
ref: src/backend/prep.ml#gen_smt_solve
mode: proof
outcome: failed
---*)
---- MODULE smt_sat ----
EXTENDS TLAPS
THEOREM ASSUME NEW a, NEW b PROVE a = b
  BY SMT
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
    @prover: smt
    @meth: time-limit: 5
    @reason: false
    @already: false
    @obl: 
    (* SMT failed with status = sat
     *)
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

    File "./smt_sat.tla", line 10, characters 3-4:
    [ERROR]: Could not prove or check:
               ASSUME NEW CONSTANT a,
                      NEW CONSTANT b,
                      SMT 
               PROVE  a = b
    File "./smt_sat.tla", line 7, character 1 to line 11, character 4:
    [ERROR]: 1/2 obligations failed.
    There were backend errors processing module `"smt_sat"`.
---*)
