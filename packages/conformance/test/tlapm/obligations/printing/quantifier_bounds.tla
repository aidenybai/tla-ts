(*---
description: Bounded quantifiers print each domain, and variables sharing one print together.
ref: src/expr/e_fmt.ml#fmt_expr
mode: obligations
outcome: proved
---*)
---- MODULE quantifier_bounds ----
CONSTANT S, T
THEOREM \A x, y \in S, z \in T : \E w \in S : x = w
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 10:3:10:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT S,
           NEW CONSTANT T
    PROVE  \A x, y \in S, z \in T : \E w \in S : x = w

    @type: obligationsnumber
    @count: 1
---*)
