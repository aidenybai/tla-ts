(*---
description: HAVE may add a formula other than the antecedent, so the later steps prove the consequent from it and the step's own obligation must show that this suffices.
ref: src/proof/p_simplify.ml#simplify_step
mode: obligations
outcome: proved
---*)
---- MODULE have_different_formula ----
CONSTANT A, B, C
THEOREM A => B
<1> HAVE C
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
           NEW CONSTANT C,
           C 
    PROVE  B

    @type: obligation
    @id: 2
    @loc: 10:1:10:11
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B,
           NEW CONSTANT C,
           <1>_a3 
    PROVE  A => B

    @type: obligation
    @id: 3
    @loc: 10:1:10:11
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B,
           NEW CONSTANT C,
           <1>_a3 
    PROVE  <1>_a3

    @type: obligationsnumber
    @count: 3
---*)
