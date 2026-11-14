(*---
description: TAKE on a goal that is not universal gives an error obligation that prints the goal, and the later steps see the goal with de Bruijn indices off by one, so it prints empty. The error branch puts a TRUE fact in the SUFFICES context without shifting the goal (src/proof/p_simplify.ml#simplify_step).
ref: src/proof/p_simplify.ml#simplify_step
features: [tlapm-bug]
mode: obligations
outcome: proved
---*)
---- MODULE take_not_universal ----
CONSTANT A
THEOREM A
<1> TAKE y
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
           TRUE 
    PROVE

    @type: obligation
    @id: 2
    @loc: 11:1:11:11
    @status: to be proved
    @obl: 
    Error: this TAKE step is applied to the following goal,
    which is not a universal formula:
      A

    @type: obligationsnumber
    @count: 2
---*)
