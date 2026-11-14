(*---
description: Two SUFFICES steps in a row each replace the goal, so the QED proves the last one.
ref: src/proof/p_gen.ml#gen_step
mode: obligations
outcome: proved
---*)
---- MODULE two_suffices ----
CONSTANT A, B, C
THEOREM A \/ B \/ C
<1> SUFFICES A \/ B
  OBVIOUS
<1> SUFFICES A
  OBVIOUS
<1> QED
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 15:3:15:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B,
           NEW CONSTANT C
    PROVE  A

    @type: obligation
    @id: 2
    @loc: 11:3:11:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B,
           NEW CONSTANT C,
           <1>_a4 
    PROVE  A \/ B \/ C

    @type: obligation
    @id: 3
    @loc: 13:3:13:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B,
           NEW CONSTANT C,
           <1>_a5 
    PROVE  A \/ B

    @type: obligationsnumber
    @count: 3
---*)
