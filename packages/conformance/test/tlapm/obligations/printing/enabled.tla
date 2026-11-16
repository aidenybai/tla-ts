(*---
description: ENABLED of an action prints as ENABLED in the obligation, unexpanded.
ref: src/expr/e_fmt.ml#fmt_expr
mode: obligations
outcome: proved
---*)
---- MODULE enabled ----
VARIABLE x
THEOREM ENABLED (x' = 1)
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
    PROVE  ENABLED (x' = 1)

    @type: obligationsnumber
    @count: 1
---*)
