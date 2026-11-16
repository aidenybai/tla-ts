(*---
description: Citing a numbered PICK step makes its predicate usable in the later steps.
ref: src/proof/p_simplify.ml#simplify_step
mode: obligations
outcome: proved
---*)
---- MODULE pick_named_cited ----
CONSTANT P(_)
THEOREM ASSUME \E x : P(x) PROVE TRUE
<1>1. PICK y : P(y)
  OBVIOUS
<1> QED
  BY <1>1
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 13:3:13:5
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           \E x : P(x) ,
           NEW CONSTANT y,
           <1>1 
    PROVE  TRUE

    @type: obligation
    @id: 2
    @loc: 13:6:13:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           \E x : P(x) ,
           NEW CONSTANT y
    PROVE  <1>1

    @type: obligation
    @id: 3
    @loc: 11:3:11:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           \E x : P(x) 
    PROVE  \E y : P(y)

    @type: obligationsnumber
    @count: 3
---*)
