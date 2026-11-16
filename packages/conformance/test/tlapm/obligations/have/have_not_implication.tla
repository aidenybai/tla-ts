(*---
description: HAVE on a goal that is not an implication gives an error obligation, and the later steps see a goal whose de Bruijn indices are off by one, printed as a truncated formula. The error branch of Proof.Simplify.simplify_step puts the HAVE fact in the SUFFICES context without shifting the goal (src/proof/p_simplify.ml#simplify_step).
ref: src/proof/p_simplify.ml#simplify_step
features: [tlapm-bug]
mode: obligations
outcome: proved
---*)
---- MODULE have_not_implication ----
CONSTANT A, B
THEOREM A /\ B
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
    @loc: 13:3:13:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B,
           A 
    PROVE  B /\

    @type: obligation
    @id: 2
    @loc: 11:1:11:11
    @status: to be proved
    @obl: 
    Error: this HAVE step is applied to the following goal,
    which is not an implication:
      A /\ B

    @type: obligationsnumber
    @count: 2
---*)
