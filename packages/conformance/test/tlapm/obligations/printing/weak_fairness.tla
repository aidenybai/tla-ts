(*---
description: WF_v(A) prints as WF with its subscript and action.
ref: src/expr/e_fmt.ml#fmt_expr
mode: obligations
outcome: proved
---*)
---- MODULE weak_fairness ----
VARIABLE x
THEOREM WF_x(x' = x) => TRUE
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
    PROVE  (WF_(x) (x' = x)) => TRUE

    @type: obligationsnumber
    @count: 1
---*)
