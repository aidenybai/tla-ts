(*---
description: Citing a numbered CASE step in its own proof makes its assumption usable.
ref: src/proof/p_anon.ml#anon
mode: obligations
outcome: proved
---*)
---- MODULE case_named_cited_in_own_proof ----
CONSTANT A, B
THEOREM B
<1>1. CASE A
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
    @loc: 13:3:13:5
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B,
           <1>1 
    PROVE  B

    @type: obligation
    @id: 2
    @loc: 13:6:13:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B
    PROVE  <1>1

    @type: obligation
    @id: 3
    @loc: 11:3:11:5
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B,
           <1>1 
    PROVE  B

    @type: obligation
    @id: 4
    @loc: 11:6:11:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B
    PROVE  <1>1

    @type: obligationsnumber
    @count: 4
---*)
