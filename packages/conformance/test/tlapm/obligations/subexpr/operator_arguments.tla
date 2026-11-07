(*---
description: Op(e)!1 first applies Op to e, then selects the first operand of the result.
ref: src/expr/e_deref.ml#resolve_bang
mode: obligations
outcome: proved
---*)
---- MODULE operator_arguments ----
CONSTANT A, B
Op(x) == x /\ B
THEOREM Op(A)!1
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
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B
    PROVE  A

    @type: obligationsnumber
    @count: 1
---*)
