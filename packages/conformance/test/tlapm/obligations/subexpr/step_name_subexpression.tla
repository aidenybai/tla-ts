(*---
description: A subexpression of a step name, cited as a fact, gives a support obligation for the selected subexpression without the step's fact.
ref: src/expr/e_anon.ml#anon_sg
mode: obligations
outcome: proved
---*)
---- MODULE step_name_subexpression ----
CONSTANT A, B
AXIOM X == A /\ B
THEOREM A
<1>1. A /\ B
  BY X
<1> QED
  BY <1>1!1
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 14:3:14:5
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B,
           X == A /\ B,
           A 
    PROVE  A

    @type: obligation
    @id: 2
    @loc: 14:6:14:12
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B,
           X == A /\ B
    PROVE  A

    @type: obligation
    @id: 3
    @loc: 12:3:12:5
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B,
           X == A /\ B,
           X 
    PROVE  A /\ B

    @type: obligation
    @id: 4
    @loc: 12:6:12:7
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B,
           X == A /\ B
    PROVE  X

    @type: obligationsnumber
    @count: 4
---*)
