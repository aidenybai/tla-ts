(*---
description: CASE with OTHER prints its arms and the OTHER arm.
ref: src/expr/e_fmt.ml#fmt_expr
mode: obligations
outcome: proved
---*)
---- MODULE case_other ----
CONSTANT A, B
THEOREM (CASE A -> 1 [] B -> 2 [] OTHER -> 3) \in {1, 2, 3}
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
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B
    PROVE  (CASE A -> 1
              [] B -> 2
              [] OTHER -> 3) \in {1, 2, 3}

    @type: obligationsnumber
    @count: 1
---*)
