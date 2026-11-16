(*---
description: An rlimit budget is only supported by the SMT and Z3 backends, so ZenonT("r5") is rejected.
ref: src/backend/prep.ml#compute_meth
mode: proof
outcome: failed
---*)
---- MODULE zenont_rlimit_rejected ----
EXTENDS Naturals, TLAPS
THEOREM ASSUME NEW P, NEW Q, P /\ Q PROVE Q /\ P
  BY ZenonT("r5")
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
           ZenonT("r5") 
    PROVE  Q /\ P

    @type: obligation
    @id: 2
    @loc: 10:6:10:18
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 10:6:10:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    @type: warning
    @msg: File "./zenont_rlimit_rejected.tla", line 10, characters 6-17 :
    A Z3 rlimit budget ("rN") is only supported by the SMT and Z3 backends.

    File "./zenont_rlimit_rejected.tla", line 10, characters 3-4:
    [ERROR]: Could not prove or check:
               ASSUME NEW CONSTANT P,
                      NEW CONSTANT Q,
                      P /\ Q ,
                      ZenonT("r5") 
               PROVE  Q /\ P
    File "./zenont_rlimit_rejected.tla", line 7, character 1 to line 11, character 4:
    [ERROR]: 1/2 obligations failed.
    There were backend errors processing module `"zenont_rlimit_rejected"`.
---*)
