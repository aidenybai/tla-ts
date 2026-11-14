(*---
description: A bulleted conjunction list prints as an infix conjunction.
ref: src/expr/e_fmt.ml#fmt_expr
mode: obligations
outcome: proved
---*)
---- MODULE junction_list ----
CONSTANT A, B, C
THEOREM /\ A
        /\ \/ B
           \/ C
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 12:3:12:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B,
           NEW CONSTANT C
    PROVE  /\ A
           /\ \/ B
              \/ C

    @type: obligationsnumber
    @count: 1
---*)
