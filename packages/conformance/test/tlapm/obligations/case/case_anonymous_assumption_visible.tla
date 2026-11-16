(*---
description: An unnumbered CASE step's assumption is visible in its own proof, whose goal is the current goal.
ref: src/proof/p_simplify.ml#simplify_step
mode: obligations
outcome: proved
---*)
---- MODULE case_anonymous_assumption_visible ----
CONSTANT A, B
THEOREM B
<1> CASE A
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
           NEW CONSTANT B,
           <1>_a3 
    PROVE  B

    @type: obligation
    @id: 2
    @loc: 11:3:11:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B,
           A 
    PROVE  B

    @type: obligationsnumber
    @count: 2
---*)
