(*---
description: "PICK x : P(x) proves \\E x : P(x) in its own proof, and the later steps get x and P(x)."
ref: src/proof/p_simplify.ml#simplify_step
mode: obligations
outcome: proved
---*)
---- MODULE pick_unbounded ----
CONSTANT P(_)
THEOREM ASSUME \E x : P(x) PROVE TRUE
<1> PICK y : P(y)
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
    @obl: ASSUME NEW CONSTANT P(_),
           \E x : P(x) ,
           NEW CONSTANT y,
           P(y) 
    PROVE  TRUE

    @type: obligation
    @id: 2
    @loc: 11:3:11:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           \E x : P(x) 
    PROVE  \E y : P(y)

    @type: obligationsnumber
    @count: 2
---*)
