(*---
description: AutoBlast's tactic "auto, blast" is written unparenthesized after by, which Isabelle rejects as an outer syntax error, so AutoBlast fails even on a propositional tautology. tlapm writes "using assms by %s" (src/backend/isabelle.ml#thy_temp, line 688) and library/TLAPS.tla line 263 gives the tactic without parentheses.
ref: src/backend/isabelle.ml#thy_temp
features: [tlapm-bug]
mode: proof
outcome: failed
---*)
---- MODULE auto_blast ----
EXTENDS TLAPS
THEOREM ASSUME NEW P, NEW Q, P /\ Q PROVE Q /\ P
  BY AutoBlast
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
    @prover: isabelle
    @meth: auto, blast; time-limit: 30
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
    @loc: 11:6:11:15
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 11:6:11:15
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./auto_blast.tla", line 11, characters 3-4:
    [ERROR]: Could not prove or check:
               ASSUME NEW CONSTANT P,
                      NEW CONSTANT Q,
                      P /\ Q ,
                      AutoBlast 
               PROVE  Q /\ P
    File "./auto_blast.tla", line 8, character 1 to line 12, character 4:
    [ERROR]: 1/2 obligations failed.
    There were backend errors processing module `"auto_blast"`.
---*)
