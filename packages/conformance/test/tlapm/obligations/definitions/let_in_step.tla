(*---
description: A LET in a step's assertion is printed in that step's obligation.
ref: src/expr/e_fmt.ml#fmt_expr
mode: obligations
outcome: proved
---*)
---- MODULE let_in_step ----
CONSTANT c
THEOREM c = c
<1>1. LET a == c IN a = c
  OBVIOUS
<1> QED
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 13:3:13:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
    PROVE  c = c

    @type: obligation
    @id: 2
    @loc: 11:3:11:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT c
    PROVE  LET a == c
           IN  a = c

    @type: obligationsnumber
    @count: 2
---*)
