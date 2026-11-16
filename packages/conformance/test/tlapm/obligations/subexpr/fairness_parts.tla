(*---
description: The subexpressions of WF_v(A) are the subscript and the action.
ref: src/expr/e_deref.ml#deref_num
mode: obligations
outcome: proved
---*)
---- MODULE fairness_parts ----
VARIABLE x
Op == WF_x(x' = x)
THEOREM Op!1 = x
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
    @obl: ASSUME NEW VARIABLE x
    PROVE  x = x

    @type: obligationsnumber
    @count: 1
---*)
