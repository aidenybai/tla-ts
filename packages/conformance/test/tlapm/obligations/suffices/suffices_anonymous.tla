(*---
description: An unnumbered SUFFICES step's proof shows that its sequent implies the goal, and later steps prove the sequent with its assumptions visible.
ref: src/proof/p_gen.ml#gen_step
mode: obligations
outcome: proved
---*)
---- MODULE suffices_anonymous ----
CONSTANT P(_)
THEOREM \A x : P(x) => P(x)
<1> SUFFICES ASSUME NEW y PROVE P(y) => P(y)
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
           NEW CONSTANT y
    PROVE  P(y) => P(y)

    @type: obligation
    @id: 2
    @loc: 11:3:11:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           <1>_a3 
    PROVE  \A x : P(x) => P(x)

    @type: obligationsnumber
    @count: 2
---*)
