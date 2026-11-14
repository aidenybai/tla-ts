(*---
description: A CASE step inside a subproof proves the subproof's goal, not the theorem's.
ref: src/proof/p_simplify.ml#simplify_step
mode: obligations
outcome: proved
---*)
---- MODULE case_nested_goal ----
CONSTANT A, B, C
THEOREM C
<1>1. B
  <2> CASE A
    OBVIOUS
  <2> QED
    OBVIOUS
<1> QED
  BY <1>1
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 16:3:16:5
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B,
           NEW CONSTANT C,
           <1>1 
    PROVE  C

    @type: obligation
    @id: 2
    @loc: 16:6:16:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B,
           NEW CONSTANT C
    PROVE  <1>1

    @type: obligation
    @id: 3
    @loc: 14:5:14:12
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B,
           NEW CONSTANT C,
           <2>_a4 
    PROVE  B

    @type: obligation
    @id: 4
    @loc: 12:5:12:12
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B,
           NEW CONSTANT C,
           A 
    PROVE  B

    @type: obligationsnumber
    @count: 4
---*)
