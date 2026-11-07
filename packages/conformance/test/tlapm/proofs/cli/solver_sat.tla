(*---
description: When the solver's output begins with sat, the obligation fails with reason false and the status is prepended to the obligation.
ref: src/backend/prep.ml#gen_smt_solve
mode: proof
args: ['--solver', echo sat]
outcome: failed
---*)
---- MODULE solver_sat ----
EXTENDS Naturals, TLAPS
THEOREM 1 = 2
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
    ASSUME TRUE 
    PROVE  1 = 2

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

    File "./solver_sat.tla", line 11, characters 3-4:
    [ERROR]: Could not prove or check:
               ASSUME SMT 
               PROVE  1 = 2
    File "./solver_sat.tla", line 8, character 1 to line 12, character 4:
    [ERROR]: 1/2 obligations failed.
    There were backend errors processing module `"solver_sat"`.
---*)
