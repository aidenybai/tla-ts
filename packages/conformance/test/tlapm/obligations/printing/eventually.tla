(*---
description: <> prints as the eventually operator.
ref: src/expr/e_fmt.ml#fmt_expr
mode: obligations
outcome: proved
---*)
---- MODULE eventually ----
VARIABLE x
THEOREM [](x = 1) => <>(x = 1)
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
    PROVE  [](x = 1) => <>(x = 1)

    @type: obligationsnumber
    @count: 1
---*)
