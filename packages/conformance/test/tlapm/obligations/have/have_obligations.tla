(*---
description: A HAVE step is a SUFFICES whose proof is BY ONLY the step itself, so it gives a main and a support obligation located at the step.
ref: src/proof/p_simplify.ml#simplify_step
mode: obligations
outcome: proved
---*)
---- MODULE have_obligations ----
CONSTANT A, B
THEOREM A => B
<1> HAVE A
<1> QED
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 12:3:12:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B,
           A 
    PROVE  B

    @type: obligation
    @id: 2
    @loc: 10:1:10:11
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B,
           <1>_a3 
    PROVE  A => B

    @type: obligation
    @id: 3
    @loc: 10:1:10:11
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B,
           <1>_a3 
    PROVE  <1>_a3

    @type: obligationsnumber
    @count: 3
---*)
