(*---
description: A LET in a theorem's statement stays in the obligation's goal.
ref: src/expr/e_fmt.ml#fmt_expr
mode: obligations
outcome: proved
---*)
---- MODULE theorem_with_let ----
CONSTANT c
THEOREM LET d == c IN d = c
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
    PROVE  LET d == c
           IN  d = c

    @type: obligationsnumber
    @count: 1
---*)
