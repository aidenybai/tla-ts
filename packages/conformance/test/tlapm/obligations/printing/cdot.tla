(*---
description: The action composition A \cdot B prints with \cdot.
ref: src/expr/e_fmt.ml#fmt_expr
mode: obligations
outcome: proved
---*)
---- MODULE cdot ----
VARIABLE x
THEOREM ((x' = 1) \cdot (x' = 2)) => TRUE
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
    PROVE  (x' = 1) \cdot (x' = 2) => TRUE

    @type: obligationsnumber
    @count: 1
---*)
