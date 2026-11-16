(*---
description: Each step adds its definition and fact to the context of later steps, so citing two earlier steps lists both names in order.
ref: src/proof/p_gen.ml#use_assertion
mode: obligations
outcome: proved
---*)
---- MODULE step_sequence_contexts_grow ----
CONSTANT c
THEOREM c = c
<1>1. 1 = 1
  OBVIOUS
<1>2. 2 = 2
  OBVIOUS
<1> QED
  BY <1>2, <1>1
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
           <1>2 ,
           <1>1 
    PROVE  c = c

    @type: obligation
    @id: 2
    @loc: 15:6:15:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
    PROVE  <1>2

    @type: obligation
    @id: 3
    @loc: 15:12:15:16
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           <1>2 
    PROVE  <1>1

    @type: obligation
    @id: 4
    @loc: 11:3:11:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
    PROVE  1 = 1

    @type: obligation
    @id: 5
    @loc: 13:3:13:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
    PROVE  2 = 2

    @type: obligationsnumber
    @count: 5
---*)
