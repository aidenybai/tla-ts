(*---
description: A primed variable prints as x'.
ref: src/expr/e_fmt.ml#fmt_expr
mode: obligations
outcome: proved
---*)
---- MODULE prime_variable ----
VARIABLE x
THEOREM x' = x
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
    PROVE  x' = x

    @type: obligationsnumber
    @count: 1
---*)
