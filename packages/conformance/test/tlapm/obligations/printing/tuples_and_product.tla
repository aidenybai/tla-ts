(*---
description: Tuples and the Cartesian product print in TLA+ syntax.
ref: src/expr/e_fmt.ml#fmt_expr
mode: obligations
outcome: proved
---*)
---- MODULE tuples_and_product ----
CONSTANT S, T
THEOREM <<1, 2>> \in S \X T \X S
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
    PROVE  <<1, 2>> \in S \X T \X S

    @type: obligationsnumber
    @count: 1
---*)
