(*---
description: "A label in a formula is kept in the obligation, printed as lab:: before the parenthesized formula."
ref: src/expr/e_fmt.ml#fmt_expr
mode: obligations
outcome: proved
---*)
---- MODULE label_in_formula ----
CONSTANT A, B
THEOREM lab :: A /\ B
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
    PROVE  lab::(A /\ B)

    @type: obligationsnumber
    @count: 1
---*)
