(*---
description: A suppressed WITNESS step proves its SUFFICES by a suppressed OBVIOUS and drops the domain obligations, so only the later steps give obligations.
ref: src/proof/p_simplify.ml#simplify_step
mode: obligations
outcome: proved
---*)
---- MODULE witness_suppressed ----
CONSTANT P(_), S, T
THEOREM \E x \in S : P(x)
<1> (*{_}*) WITNESS 1 \in T
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
           NEW CONSTANT S,
           NEW CONSTANT T
    PROVE  P(1)

    @type: obligationsnumber
    @count: 1
---*)
