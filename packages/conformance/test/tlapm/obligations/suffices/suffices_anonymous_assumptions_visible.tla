(*---
description: After an unnumbered SUFFICES step, its assumptions are visible to the later steps.
ref: src/proof/p_gen.ml#prove_assertion
mode: obligations
outcome: proved
---*)
---- MODULE suffices_anonymous_assumptions_visible ----
CONSTANT P(_)
THEOREM \A x : P(x) => P(x)
<1> SUFFICES ASSUME NEW y, P(y) PROVE P(y)
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
           NEW CONSTANT y,
           P(y) 
    PROVE  P(y)

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
