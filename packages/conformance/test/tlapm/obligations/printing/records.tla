(*---
description: Record constructors, record sets and field access print in TLA+ syntax.
ref: src/expr/e_fmt.ml#fmt_expr
mode: obligations
outcome: proved
---*)
---- MODULE records ----
CONSTANT S
THEOREM [a |-> 1, b |-> 2].a \in [a : S, b : S]
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
    PROVE  [a |-> 1, b |-> 2].a \in [a : S, b : S]

    @type: obligationsnumber
    @count: 1
---*)
