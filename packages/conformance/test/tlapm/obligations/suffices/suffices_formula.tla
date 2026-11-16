(*---
description: SUFFICES with a plain formula replaces the goal by that formula for the later steps.
ref: src/proof/p_gen.ml#gen_step
mode: obligations
outcome: proved
---*)
---- MODULE suffices_formula ----
CONSTANT A, B
THEOREM A \/ B
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
    @loc: 13:3:13:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B
    PROVE  A

    @type: obligation
    @id: 2
    @loc: 11:3:11:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B,
           <1>_a3 
    PROVE  A \/ B

    @type: obligationsnumber
    @count: 2
---*)
