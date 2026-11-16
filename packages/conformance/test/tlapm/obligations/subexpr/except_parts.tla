(*---
description: The subexpressions of EXCEPT are the function, then each new value.
ref: src/expr/e_deref.ml#deref_num
mode: obligations
outcome: proved
---*)
---- MODULE except_parts ----
CONSTANT f
Op == [f EXCEPT ![1] = 2]
THEOREM Op!1 = f /\ Op!2 = 2
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
    @obl: ASSUME NEW CONSTANT f
    PROVE  f = f /\ 2 = 2

    @type: obligationsnumber
    @count: 1
---*)
