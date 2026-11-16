(*---
description: A tactic Isabelle does not know makes the theory fail to load, so the obligation fails with reason false.
ref: src/backend/prep.ml#compute_meth
mode: proof
outcome: failed
---*)
---- MODULE isam_unknown_tactic ----
EXTENDS TLAPS
THEOREM ASSUME NEW P, NEW Q, P /\ Q PROVE Q /\ P
  BY IsaM("no_such_tactic")
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
    @prover: isabelle
    @meth: no_such_tactic; time-limit: 30
    @reason: false
    @already: false
    @obl: 
    ASSUME NEW CONSTANT P,
           NEW CONSTANT Q,
           P /\ Q ,
           TRUE 
    PROVE  Q /\ P

    @type: obligation
    @id: 2
    @loc: 10:6:10:28
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 10:6:10:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./isam_unknown_tactic.tla", line 10, characters 3-4:
    [ERROR]: Could not prove or check:
               ASSUME NEW CONSTANT P,
                      NEW CONSTANT Q,
                      P /\ Q ,
                      IsaM("no_such_tactic") 
               PROVE  Q /\ P
    File "./isam_unknown_tactic.tla", line 7, character 1 to line 11, character 4:
    [ERROR]: 1/2 obligations failed.
    There were backend errors processing module `"isam_unknown_tactic"`.
---*)
