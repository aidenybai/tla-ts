(*---
description: "The subexpressions of [A]_v are the action and the subscript."
ref: src/expr/e_deref.ml#deref_num
mode: obligations
outcome: proved
---*)
---- MODULE square_action ----
VARIABLE x
Op == [x' = x]_x
THEOREM Op!1 \/ Op!2 = x
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
    PROVE  x' = x \/ x = x

    @type: obligationsnumber
    @count: 1
---*)
