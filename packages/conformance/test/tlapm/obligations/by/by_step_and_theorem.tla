(*---
description: A BY citing a theorem and a step lists both names as facts, and gives a support obligation for each.
ref: src/proof/p_simplify.ml#simplify
mode: obligations
outcome: proved
---*)
---- MODULE by_step_and_theorem ----
CONSTANT c
THEOREM T == c = c
  OBVIOUS
THEOREM c = c /\ c = c
<1>1. c = c
  OBVIOUS
<1> QED
  BY T, <1>1
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 10:3:10:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
    PROVE  c = c

    @type: obligation
    @id: 2
    @loc: 15:3:15:5
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           T ,
           <1>1 
    PROVE  c = c /\ c = c

    @type: obligation
    @id: 3
    @loc: 15:6:15:7
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
    PROVE  T

    @type: obligation
    @id: 4
    @loc: 15:9:15:13
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           T 
    PROVE  <1>1

    @type: obligation
    @id: 5
    @loc: 13:3:13:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
    PROVE  c = c

    @type: obligationsnumber
    @count: 5
---*)
