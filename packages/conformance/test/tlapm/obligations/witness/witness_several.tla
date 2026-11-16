(*---
description: WITNESS with several expressions instantiates that many bound variables of the existential.
ref: src/proof/p_simplify.ml#simplify_step
mode: obligations
outcome: proved
---*)
---- MODULE witness_several ----
CONSTANT P(_, _)
THEOREM \E x, y : P(x, y)
<1> WITNESS 1, 2
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
    @obl: ASSUME NEW CONSTANT P(_, _)
    PROVE  P(1, 2)

    @type: obligation
    @id: 2
    @loc: 10:1:10:17
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_, _),
           <1>_a3 
    PROVE  \E x, y : P(x, y)

    @type: obligationsnumber
    @count: 2
---*)
