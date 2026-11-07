(*---
description: A second step with the same number shadows the first, so a later citation refers to the second, printed with a suffix to tell them apart.
ref: src/expr/e_anon.ml#anon_sg
mode: obligations
outcome: proved
---*)
---- MODULE duplicate_step_number_shadows ----
CONSTANT c
THEOREM c = c
<1>1. 1 = 1
  OBVIOUS
<1>1. 2 = 2
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
           <1>1_1 
    PROVE  c = c

    @type: obligation
    @id: 2
    @loc: 15:6:15:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
    PROVE  <1>1_1

    @type: obligation
    @id: 3
    @loc: 11:3:11:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
    PROVE  1 = 1

    @type: obligation
    @id: 4
    @loc: 13:3:13:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
    PROVE  2 = 2

    @type: obligationsnumber
    @count: 4
---*)
