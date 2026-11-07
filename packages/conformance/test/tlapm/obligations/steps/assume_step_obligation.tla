(*---
description: The obligation of a numbered ASSUME ... PROVE step proves its goal with its NEW declarations in the context and its assumptions hidden.
ref: src/proof/p_gen.ml#prove_assertion
mode: obligations
outcome: proved
---*)
---- MODULE assume_step_obligation ----
CONSTANT P(_)
THEOREM \A x : P(x) => P(x)
<1>1. ASSUME NEW y, P(y) PROVE P(y)
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
           <1>1 
    PROVE  \A x : P(x) => P(x)

    @type: obligation
    @id: 2
    @loc: 13:6:13:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_)
    PROVE  <1>1

    @type: obligation
    @id: 3
    @loc: 11:3:11:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           NEW CONSTANT y
    PROVE  P(y)

    @type: obligationsnumber
    @count: 3
---*)
