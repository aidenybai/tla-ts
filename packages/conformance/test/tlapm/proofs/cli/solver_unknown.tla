(*---
description: When the solver's output begins with unknown, the obligation fails and tlapm reports status unknown.
ref: src/backend/prep.ml#gen_smt_solve
mode: proof
args: ['--solver', echo unknown]
outcome: failed
---*)
---- MODULE solver_unknown ----
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
    (* SMT failed with status = unknown
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

    File "./solver_unknown.tla", line 11, characters 3-4:
    [ERROR]: Could not prove or check:
               ASSUME SMT 
               PROVE  1 = 2
    File "./solver_unknown.tla", line 8, character 1 to line 12, character 4:
    [ERROR]: 1/2 obligations failed.
    There were backend errors processing module `"solver_unknown"`.
---*)
