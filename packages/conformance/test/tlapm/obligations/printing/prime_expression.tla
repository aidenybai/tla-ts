(*---
description: A primed compound expression keeps its parentheses, as (x + y)'.
ref: src/expr/e_fmt.ml#fmt_expr
mode: obligations
outcome: proved
---*)
---- MODULE prime_expression ----
EXTENDS Naturals
VARIABLES x, y
THEOREM (x + y)' = x' + y'
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
    @obl: ASSUME NEW VARIABLE x,
           NEW VARIABLE y
    PROVE  (x + y)' = x' + y'

    @type: obligationsnumber
    @count: 1
---*)
