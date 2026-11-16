(*---
description: ZenonT with a string that is not an rlimit budget is rejected with the SMT budget message, since every string timeout is parsed as an rlimit.
ref: src/backend/prep.ml#compute_meth
mode: proof
outcome: failed
---*)
---- MODULE zenont_string_rejected ----
EXTENDS Naturals, TLAPS
THEOREM ASSUME NEW P, NEW Q, P /\ Q PROVE Q /\ P
  BY ZenonT("x")
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
    @obl: ASSUME NEW CONSTANT P,
           NEW CONSTANT Q,
           P /\ Q ,
           ZenonT("x") 
    PROVE  Q /\ P

    @type: obligation
    @id: 2
    @loc: 10:6:10:17
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 10:6:10:17
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    @type: warning
    @msg: File "./zenont_string_rejected.tla", line 10, character 15 :
    Invalid SMT budget "x": expected a number of seconds (wall-clock timeout), or a deterministic Z3 rlimit budget of the form "rN" (e.g. "r5").

    File "./zenont_string_rejected.tla", line 10, characters 3-4:
    [ERROR]: Could not prove or check:
               ASSUME NEW CONSTANT P,
                      NEW CONSTANT Q,
                      P /\ Q ,
                      ZenonT("x") 
               PROVE  Q /\ P
    File "./zenont_string_rejected.tla", line 7, character 1 to line 11, character 4:
    [ERROR]: 1/2 obligations failed.
    There were backend errors processing module `"zenont_string_rejected"`.
---*)
