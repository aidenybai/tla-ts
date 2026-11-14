(*---
description: TAKE with several names strips that many bound variables of the universal.
ref: src/proof/p_simplify.ml#simplify_step
mode: obligations
outcome: proved
---*)
---- MODULE take_several ----
CONSTANT P(_, _)
THEOREM \A x, y : P(x, y)
<1> TAKE a, b
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
    @obl: ASSUME NEW CONSTANT P(_, _),
           NEW CONSTANT a,
           NEW CONSTANT b
    PROVE  P(a, b)

    @type: obligation
    @id: 2
    @loc: 10:1:10:14
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_, _),
           <1>_a3 
    PROVE  \A x, y : P(x, y)

    @type: obligation
    @id: 3
    @loc: 10:1:10:14
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_, _),
           <1>_a3 
    PROVE  <1>_a3

    @type: obligationsnumber
    @count: 3
---*)
