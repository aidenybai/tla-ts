(*---
description: A subexpression of a step name may appear in a later step's assertion.
ref: src/expr/e_anon.ml#anon_sg
mode: obligations
outcome: proved
---*)
---- MODULE step_name_subexpression_in_goal ----
CONSTANT A, B
THEOREM A /\ B => A
<1>1. A /\ B => A
  OBVIOUS
<1>2. <1>1!1 => <1>1!2
  BY <1>1
<1> QED
  BY <1>2
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
           <1>2 
    PROVE  A /\ B => A

    @type: obligation
    @id: 2
    @loc: 15:6:15:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B
    PROVE  <1>2

    @type: obligation
    @id: 3
    @loc: 11:3:11:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B
    PROVE  A /\ B => A

    @type: obligation
    @id: 4
    @loc: 13:3:13:5
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B,
           <1>1 
    PROVE  A /\ B => A

    @type: obligation
    @id: 5
    @loc: 13:6:13:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B
    PROVE  <1>1

    @type: obligationsnumber
    @count: 5
---*)
