(*---
description: Citing a labelled QED step inside its own proof warns that the name introduces no assumptions.
ref: src/proof/p_anon.ml#anon
mode: obligations
outcome: proved
---*)
---- MODULE qed_name_cited_in_own_proof ----
THEOREM TRUE
<1>q QED
  BY <1>q
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 10:3:10:5
    @status: to be proved
    @obl: ASSUME TRUE 
    PROVE  TRUE

    @type: obligation
    @id: 2
    @loc: 10:6:10:10
    @status: to be proved
    @obl: TRUE

    @type: warning
    @msg: File "./qed_name_cited_in_own_proof.tla", line 10, characters 6-9 :
    Warning: <1>q does not introduce any assumptions. It does not make sense to use it here.

    @type: obligationsnumber
    @count: 2
---*)
