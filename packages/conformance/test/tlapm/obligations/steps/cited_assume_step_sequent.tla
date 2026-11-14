(*---
description: Citing a numbered ASSUME step later adds its name as a fact, and the support obligation proves the name.
ref: src/proof/p_gen.ml#use_assertion
mode: obligations
outcome: proved
---*)
---- MODULE cited_assume_step_sequent ----
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
