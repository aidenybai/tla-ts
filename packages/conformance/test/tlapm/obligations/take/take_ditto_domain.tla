(*---
description: TAKE x, y \in S expands the shared domain to both variables.
ref: src/proof/p_simplify.ml#expand_dittoes
mode: obligations
outcome: proved
---*)
---- MODULE take_ditto_domain ----
CONSTANT P(_, _), S
THEOREM \A x, y \in S : P(x, y)
<1> TAKE a, b \in S
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
    @obl: ASSUME NEW CONSTANT P(_, _),
           NEW CONSTANT S,
           NEW CONSTANT a \in S,
           NEW CONSTANT b \in S
    PROVE  P(a, b)

    @type: obligation
    @id: 2
    @loc: 10:1:10:20
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_, _),
           NEW CONSTANT S,
           <1>_a3 
    PROVE  \A x, y \in S : P(x, y)

    @type: obligation
    @id: 3
    @loc: 10:1:10:20
    @status: to be proved
    @obl: ASSUME NEW CONSTANT P(_, _),
           NEW CONSTANT S,
           <1>_a3 
    PROVE  <1>_a3

    @type: obligationsnumber
    @count: 3
---*)
