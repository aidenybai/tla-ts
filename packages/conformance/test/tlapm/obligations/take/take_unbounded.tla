(*---
description: TAKE x on an unbounded universal declares the constant and leaves the body as the goal.
ref: src/proof/p_simplify.ml#simplify_step
mode: obligations
outcome: proved
---*)
---- MODULE take_unbounded ----
CONSTANT P(_)
THEOREM \A x : P(x)
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
    @loc: 12:3:12:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           NEW CONSTANT y
    PROVE  P(y)

    @type: obligation
    @id: 2
    @loc: 10:1:10:11
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           <1>_a3 
    PROVE  \A x : P(x)

    @type: obligation
    @id: 3
    @loc: 10:1:10:11
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           <1>_a3 
    PROVE  <1>_a3

    @type: obligationsnumber
    @count: 3
---*)
