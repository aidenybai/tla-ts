(*---
description: The string "r" alone is too short to be an rlimit budget and is rejected.
ref: src/backend/prep.ml#compute_meth
mode: proof
outcome: failed
---*)
---- MODULE smtt_rlimit_bare_r_rejected ----
EXTENDS Naturals, TLAPS
THEOREM \A x \in Nat : x + 0 = x
  BY SMTT("r")
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
    @obl: ASSUME SMTT("r") 
    PROVE  \A x \in Nat : x + 0 = x

    @type: obligation
    @id: 2
    @loc: 10:6:10:15
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 10:6:10:15
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    @type: warning
    @msg: File "./smtt_rlimit_bare_r_rejected.tla", line 10, character 13 :
    Invalid SMT budget "r": expected a number of seconds (wall-clock timeout), or a deterministic Z3 rlimit budget of the form "rN" (e.g. "r5").

    File "./smtt_rlimit_bare_r_rejected.tla", line 10, characters 3-4:
    [ERROR]: Could not prove or check:
               ASSUME SMTT("r") 
               PROVE  \A x \in Nat : x + 0 = x
    File "./smtt_rlimit_bare_r_rejected.tla", line 7, character 1 to line 11, character 4:
    [ERROR]: 1/2 obligations failed.
    There were backend errors processing module `"smtt_rlimit_bare_r_rejected"`.
---*)
