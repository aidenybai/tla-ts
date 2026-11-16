(*---
description: A fact used by an earlier step is visible inside the subproof of a later step.
ref: src/proof/p_gen.ml#gen_step
mode: obligations
outcome: proved
---*)
---- MODULE step_use_inherited_by_subproof ----
CONSTANT c
AXIOM A == c = 1
THEOREM c = 1
<1> USE A
<1>1. c = 1
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
    @loc: 15:3:15:5
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           A == c = 1,
           A ,
           <1>1 
    PROVE  c = 1

    @type: obligation
    @id: 2
    @loc: 15:6:15:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           A == c = 1,
           A 
    PROVE  <1>1

    @type: obligation
    @id: 3
    @loc: 11:9:11:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           A == c = 1
    PROVE  A

    @type: obligation
    @id: 4
    @loc: 13:3:13:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c,
           A == c = 1,
           A 
    PROVE  c = 1

    @type: obligationsnumber
    @count: 4
---*)
