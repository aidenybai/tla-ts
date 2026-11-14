(*---
description: A temporal theorem keeps its temporal operators in the obligation.
ref: src/expr/e_fmt.ml#fmt_expr
mode: obligations
outcome: proved
---*)
---- MODULE theorem_temporal ----
VARIABLE x
THEOREM [](x = 0) => <>(x = 0)
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
    @obl: ASSUME NEW VARIABLE x
    PROVE  [](x = 0) => <>(x = 0)

    @type: obligationsnumber
    @count: 1
---*)
