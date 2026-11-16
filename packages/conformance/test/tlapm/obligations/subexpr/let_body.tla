(*---
description: The subexpression !1 of a LET is its body, which keeps the LET's definitions.
ref: src/expr/e_deref.ml#deref_num
mode: obligations
outcome: proved
---*)
---- MODULE let_body ----
CONSTANT c
Op == LET d == c IN d = c
THEOREM Op!1
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
    PROVE  LET d == c
           IN  d = c

    @type: obligationsnumber
    @count: 1
---*)
