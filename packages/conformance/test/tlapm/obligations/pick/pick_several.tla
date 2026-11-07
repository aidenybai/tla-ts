(*---
description: PICK with two variables declares both and proves a double existential.
ref: src/proof/p_simplify.ml#simplify_step
mode: obligations
outcome: proved
---*)
---- MODULE pick_several ----
CONSTANT P(_, _)
THEOREM ASSUME \E x, y : P(x, y) PROVE TRUE
<1> PICK a, b : P(a, b)
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
    @obl: ASSUME NEW CONSTANT P(_, _),
           \E x, y : P(x, y) ,
           NEW CONSTANT a,
           NEW CONSTANT b,
           P(a, b) 
    PROVE  TRUE

    @type: obligation
    @id: 2
    @loc: 11:3:11:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_, _),
           \E x, y : P(x, y) 
    PROVE  \E a, b : P(a, b)

    @type: obligationsnumber
    @count: 2
---*)
