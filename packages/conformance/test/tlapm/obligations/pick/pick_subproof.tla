(*---
description: A PICK step may have a structured proof of the existential.
ref: src/proof/p_simplify.ml#simplify_step
mode: obligations
outcome: proved
---*)
---- MODULE pick_subproof ----
CONSTANT P(_)
THEOREM ASSUME P(1) PROVE TRUE
<1> PICK y : P(y)
  <2> WITNESS 1
  <2> QED
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
    @loc: 15:3:15:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           P(1) ,
           NEW CONSTANT y,
           P(y) 
    PROVE  TRUE

    @type: obligation
    @id: 2
    @loc: 13:5:13:12
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           P(1) 
    PROVE  P(1)

    @type: obligation
    @id: 3
    @loc: 11:3:11:16
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           P(1) ,
           <2>_a6 
    PROVE  \E y : P(y)

    @type: obligationsnumber
    @count: 3
---*)
