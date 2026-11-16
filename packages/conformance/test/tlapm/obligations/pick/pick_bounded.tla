(*---
description: "PICK x \\in S : P(x) proves the bounded existential, and declares x with its bound for the later steps."
ref: src/proof/p_simplify.ml#simplify_step
mode: obligations
outcome: proved
---*)
---- MODULE pick_bounded ----
CONSTANT P(_), S
THEOREM ASSUME \E x \in S : P(x) PROVE TRUE
<1> PICK y \in S : P(y)
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
           NEW CONSTANT S,
           \E x \in S : P(x) ,
           NEW CONSTANT y \in S,
           P(y) 
    PROVE  TRUE

    @type: obligation
    @id: 2
    @loc: 11:3:11:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           NEW CONSTANT S,
           \E x \in S : P(x) 
    PROVE  \E y \in S : P(y)

    @type: obligationsnumber
    @count: 2
---*)
