(*---
description: A LAMBDA argument is printed as LAMBDA in the obligation.
ref: src/expr/e_fmt.ml#fmt_expr
mode: obligations
outcome: proved
---*)
---- MODULE lambda_argument ----
CONSTANT c
Op(F(_)) == F(c)
THEOREM Op(LAMBDA x : x = c)
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
    @obl: ASSUME NEW CONSTANT c
    PROVE  Op(LAMBDA x : x = c)

    @type: obligationsnumber
    @count: 1
---*)
