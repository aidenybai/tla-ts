(*---
description: A pragma that takes its prover from @ but has no argument reports that arguments are missing.
ref: src/backend/prep.ml#compute_meth
mode: proof
outcome: failed
---*)
---- MODULE custom_pragma_missing_argument ----
EXTENDS Naturals, TLAPS
With == TRUE (*{ by (prover:@) }*)
THEOREM ASSUME NEW P, NEW Q, P /\ Q PROVE Q /\ P
  BY With
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
    @prover: fail
    @meth: time-limit: inf
    @reason: unexpected error
    @already: false
    @obl: ASSUME NEW CONSTANT P,
           NEW CONSTANT Q,
           P /\ Q ,
           With 
    PROVE  Q /\ P

    @type: obligation
    @id: 2
    @loc: 11:6:11:10
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 11:6:11:10
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    @type: warning
    @msg: File "./custom_pragma_missing_argument.tla", line 11, characters 6-9 :
    Some arguments are missing

    File "./custom_pragma_missing_argument.tla", line 11, characters 3-4:
    [ERROR]: Could not prove or check:
               ASSUME NEW CONSTANT P,
                      NEW CONSTANT Q,
                      P /\ Q ,
                      With 
               PROVE  Q /\ P
    File "./custom_pragma_missing_argument.tla", line 7, character 1 to line 12, character 4:
    [ERROR]: 1/2 obligations failed.
    There were backend errors processing module `"custom_pragma_missing_argument"`.
---*)
