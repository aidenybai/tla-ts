(*---
description: A LET in a theorem's goal is printed in the obligation with its definitions.
ref: src/expr/e_fmt.ml#fmt_expr
mode: obligations
outcome: proved
---*)
---- MODULE let_in_goal ----
CONSTANT c
THEOREM LET a == c  b(x) == x IN b(a) = c
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
    @obl: ASSUME NEW CONSTANT c
    PROVE  LET a == c
               b(x) == x
           IN  b(a) = c

    @type: obligationsnumber
    @count: 1
---*)
