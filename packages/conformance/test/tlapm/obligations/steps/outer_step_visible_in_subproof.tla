(*---
description: A step name from an enclosing proof can be cited inside a nested subproof.
ref: src/proof/p_anon.ml#anon
mode: obligations
outcome: proved
---*)
---- MODULE outer_step_visible_in_subproof ----
CONSTANT c
THEOREM c = c
<1>1. c = c
  OBVIOUS
<1>2. c = c /\ TRUE
  <2>1. TRUE
    OBVIOUS
  <2> QED
    BY <1>1, <2>1
<1> QED
  BY <1>2
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 18:3:18:5
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           <1>2 
    PROVE  c = c

    @type: obligation
    @id: 2
    @loc: 18:6:18:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
    PROVE  <1>2

    @type: obligation
    @id: 3
    @loc: 11:3:11:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
    PROVE  c = c

    @type: obligation
    @id: 4
    @loc: 16:5:16:7
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           <1>1 ,
           <2>1 
    PROVE  c = c /\ TRUE

    @type: obligation
    @id: 5
    @loc: 16:8:16:12
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
    PROVE  <1>1

    @type: obligation
    @id: 6
    @loc: 16:14:16:18
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           <1>1 
    PROVE  <2>1

    @type: obligation
    @id: 7
    @loc: 14:5:14:12
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
    PROVE  TRUE

    @type: obligationsnumber
    @count: 7
---*)
