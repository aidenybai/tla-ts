(*---
description: A numbered CASE step's assumption is hidden in its own proof, as for any numbered ASSUME step.
ref: src/proof/p_simplify.ml#simplify_step
mode: obligations
outcome: proved
---*)
---- MODULE case_named_assumption_hidden ----
CONSTANT A, B
THEOREM B
<1>1. CASE A
  OBVIOUS
<1>2. CASE ~A
  OBVIOUS
<1> QED
  BY <1>1, <1>2
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 15:3:15:5
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B,
           <1>1 ,
           <1>2 
    PROVE  B

    @type: obligation
    @id: 2
    @loc: 15:6:15:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B
    PROVE  <1>1

    @type: obligation
    @id: 3
    @loc: 15:12:15:16
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B,
           <1>1 
    PROVE  <1>2

    @type: obligation
    @id: 4
    @loc: 11:3:11:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B
    PROVE  B

    @type: obligation
    @id: 5
    @loc: 13:3:13:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B
    PROVE  B

    @type: obligationsnumber
    @count: 5
---*)
