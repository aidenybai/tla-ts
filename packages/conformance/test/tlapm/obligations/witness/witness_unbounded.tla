(*---
description: WITNESS e on an unbounded existential replaces the goal by its body applied to e, and the step's obligation proves the old goal from the new one.
ref: src/proof/p_simplify.ml#simplify_step
mode: obligations
outcome: proved
---*)
---- MODULE witness_unbounded ----
CONSTANT P(_)
THEOREM \E x : P(x)
<1> WITNESS 1
<1> QED
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 12:3:12:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_)
    PROVE  P(1)

    @type: obligation
    @id: 2
    @loc: 10:1:10:14
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_),
           <1>_a3 
    PROVE  \E x : P(x)

    @type: obligationsnumber
    @count: 2
---*)
