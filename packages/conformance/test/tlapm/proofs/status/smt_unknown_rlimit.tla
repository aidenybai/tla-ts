(*---
description: When Z3 exhausts its rlimit budget it answers unknown, and the obligation fails with that status.
ref: src/backend/prep.ml#gen_smt_solve
mode: proof
outcome: failed
---*)
---- MODULE smt_unknown_rlimit ----
EXTENDS Integers, TLAPS
THEOREM 1 = 2
  BY SMTT("r0.01")
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
    @meth: time-limit: inf
    @reason: false
    @already: false
    @obl: 
    (* SMT failed with status = unknown
     *)
    ASSUME TRUE 
    PROVE  1 = 2

    @type: obligation
    @id: 2
    @loc: 10:6:10:19
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 10:6:10:19
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./smt_unknown_rlimit.tla", line 10, characters 3-4:
    [ERROR]: Could not prove or check:
               ASSUME SMTT("r0.01") 
               PROVE  1 = 2
    File "./smt_unknown_rlimit.tla", line 7, character 1 to line 11, character 4:
    [ERROR]: 1/2 obligations failed.
    There were backend errors processing module `"smt_unknown_rlimit"`.
---*)
