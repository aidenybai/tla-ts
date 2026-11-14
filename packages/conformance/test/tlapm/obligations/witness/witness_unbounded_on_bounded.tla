(*---
description: WITNESS e on a bounded existential gives an error obligation saying the argument does not match the pattern.
ref: src/proof/p_simplify.ml#simplify_step
mode: obligations
outcome: proved
---*)
---- MODULE witness_unbounded_on_bounded ----
CONSTANT P(_), S
THEOREM \E x \in S : P(x)
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
    @obl: ASSUME NEW CONSTANT P(_),
           NEW CONSTANT S
    PROVE  P(1)

    @type: obligation
    @id: 2
    @loc: 10:1:10:14
    @status: to be proved
    @obl: 
    Error: the WITNESS argument (1) does not match the pattern (x \in S)

    @type: obligationsnumber
    @count: 2
---*)
