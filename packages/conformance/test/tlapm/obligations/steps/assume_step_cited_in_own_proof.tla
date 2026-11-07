(*---
description: Citing a numbered ASSUME step inside its own proof makes its assumptions usable, as the fact the step's name denotes there.
ref: src/proof/p_gen.ml#prove_assertion
mode: obligations
outcome: proved
---*)
---- MODULE assume_step_cited_in_own_proof ----
CONSTANT P(_)
THEOREM \A x : P(x) => P(x)
<1>1. ASSUME NEW y, P(y) PROVE P(y)
  BY <1>1
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
    @loc: 11:3:11:5
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           NEW CONSTANT y,
           <1>1 
    PROVE  P(y)

    @type: obligation
    @id: 4
    @loc: 11:6:11:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           NEW CONSTANT y
    PROVE  <1>1

    @type: obligationsnumber
    @count: 4
---*)
