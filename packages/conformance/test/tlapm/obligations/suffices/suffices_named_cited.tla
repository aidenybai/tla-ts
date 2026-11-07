(*---
description: Citing a numbered SUFFICES step after it makes its assumptions available through the step's name.
ref: src/proof/p_gen.ml#prove_assertion
mode: obligations
outcome: proved
---*)
---- MODULE suffices_named_cited ----
CONSTANT P(_)
THEOREM \A x : P(x) => P(x)
<1>1. SUFFICES ASSUME NEW y, P(y) PROVE P(y)
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
           NEW CONSTANT y,
           <1>1 
    PROVE  P(y)

    @type: obligation
    @id: 2
    @loc: 13:6:13:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           NEW CONSTANT y
    PROVE  <1>1

    @type: obligation
    @id: 3
    @loc: 11:3:11:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           <1>1 
    PROVE  \A x : P(x) => P(x)

    @type: obligationsnumber
    @count: 3
---*)
