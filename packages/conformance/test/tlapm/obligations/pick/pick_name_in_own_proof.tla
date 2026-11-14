(*---
description: Citing a numbered PICK step inside its own proof warns that the name introduces no assumptions.
ref: src/proof/p_anon.ml#anon
mode: obligations
outcome: proved
---*)
---- MODULE pick_name_in_own_proof ----
CONSTANT P(_)
THEOREM ASSUME \E x : P(x) PROVE TRUE
<1>1. PICK y : P(y)
  BY <1>1
<1> QED
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 13:3:13:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           \E x : P(x) ,
           NEW CONSTANT y
    PROVE  TRUE

    @type: obligation
    @id: 2
    @loc: 11:3:11:5
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           \E x : P(x) ,
           TRUE 
    PROVE  \E y : P(y)

    @type: obligation
    @id: 3
    @loc: 11:6:11:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           \E x : P(x) 
    PROVE  TRUE

    @type: warning
    @msg: File "./pick_name_in_own_proof.tla", line 11, characters 6-9 :
    Warning: <1>1 does not introduce any assumptions. It does not make sense to use it here.

    @type: obligationsnumber
    @count: 3
---*)
