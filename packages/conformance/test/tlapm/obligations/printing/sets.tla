(*---
description: Set enumeration, filter, map, SUBSET, UNION and the empty set print in TLA+ syntax.
ref: src/expr/e_fmt.ml#fmt_expr
mode: obligations
outcome: proved
---*)
---- MODULE sets ----
CONSTANT S
THEOREM {x \in S : x = x} \cup {{x} : x \in S} \subseteq SUBSET UNION {S, {}}
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
    @obl: ASSUME NEW CONSTANT S
    PROVE  {x \in S : x = x} \cup {{x} : x \in S} \subseteq SUBSET UNION {S, {}}

    @type: obligationsnumber
    @count: 1
---*)
