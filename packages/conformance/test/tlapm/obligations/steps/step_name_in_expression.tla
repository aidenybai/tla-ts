(*---
description: A step name may appear inside an expression of a later step, where it stands for the step's assertion.
ref: src/proof/p_parser.ml#filter_usebody_fact
mode: obligations
outcome: proved
---*)
---- MODULE step_name_in_expression ----
CONSTANT c
THEOREM c = c
<1>1. c = c
  OBVIOUS
<1>2. <1>1 \/ FALSE
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
    @loc: 15:3:15:5
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           <1>1 
    PROVE  c = c

    @type: obligation
    @id: 2
    @loc: 15:6:15:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
    PROVE  <1>1

    @type: obligation
    @id: 3
    @loc: 11:3:11:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
    PROVE  c = c

    @type: obligation
    @id: 4
    @loc: 13:3:13:5
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           <1>1 
    PROVE  c = c \/ FALSE

    @type: obligation
    @id: 5
    @loc: 13:6:13:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
    PROVE  <1>1

    @type: obligationsnumber
    @count: 5
---*)
