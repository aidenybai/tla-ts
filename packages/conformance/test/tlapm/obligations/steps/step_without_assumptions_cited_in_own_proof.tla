(*---
description: Citing a step without assumptions inside its own proof warns that the name introduces no assumptions, and the citation becomes TRUE.
ref: src/expr/e_anon.ml#anon_sg
mode: obligations
outcome: proved
---*)
---- MODULE step_without_assumptions_cited_in_own_proof ----
THEOREM TRUE
<1>1. TRUE
  BY <1>1
<1> QED
  BY <1>1
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 12:3:12:5
    @status: to be proved
    @obl: ASSUME <1>1 
    PROVE  TRUE

    @type: obligation
    @id: 2
    @loc: 12:6:12:10
    @status: to be proved
    @obl: <1>1

    @type: obligation
    @id: 3
    @loc: 10:3:10:5
    @status: to be proved
    @obl: ASSUME TRUE 
    PROVE  TRUE

    @type: obligation
    @id: 4
    @loc: 10:6:10:10
    @status: to be proved
    @obl: TRUE

    @type: warning
    @msg: File "./step_without_assumptions_cited_in_own_proof.tla", line 10, characters 6-9 :
    Warning: <1>1 does not introduce any assumptions. It does not make sense to use it here.

    @type: obligationsnumber
    @count: 4
---*)
