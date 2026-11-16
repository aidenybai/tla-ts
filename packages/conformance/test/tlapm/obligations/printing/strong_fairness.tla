(*---
description: SF_v(A) prints as SF with its subscript and action.
ref: src/expr/e_fmt.ml#fmt_expr
mode: obligations
outcome: proved
---*)
---- MODULE strong_fairness ----
VARIABLE x
THEOREM SF_<<x>>(x' # x) => TRUE
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
    PROVE  (SF_(<<x>>) (x' # x)) => TRUE

    @type: obligationsnumber
    @count: 1
---*)
