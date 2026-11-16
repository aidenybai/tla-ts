(*---
description: ENABLED of a defined action keeps the definition folded.
ref: src/expr/e_fmt.ml#fmt_expr
mode: obligations
outcome: proved
---*)
---- MODULE enabled_definition ----
VARIABLE x
A == x' = x
THEOREM ENABLED A
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 11:3:11:10
    @status: to be proved
    @obl: ASSUME NEW VARIABLE x
    PROVE  ENABLED A

    @type: obligationsnumber
    @count: 1
---*)
