(*---
description: IF THEN ELSE prints on one line when it fits.
ref: src/expr/e_fmt.ml#fmt_expr
mode: obligations
outcome: proved
---*)
---- MODULE if_then_else ----
CONSTANT A
THEOREM (IF A THEN 1 ELSE 2) \in {1, 2}
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
    @obl: ASSUME NEW CONSTANT A
    PROVE  (IF A THEN 1 ELSE 2) \in {1, 2}

    @type: obligationsnumber
    @count: 1
---*)
