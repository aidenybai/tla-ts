(*---
description: "The subexpressions of f[a] are f and a."
ref: src/expr/e_deref.ml#deref_num
mode: obligations
outcome: proved
---*)
---- MODULE function_application ----
CONSTANT f, a
Op == f[a]
THEOREM Op!1 = f /\ Op!2 = a
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
    @obl: ASSUME NEW CONSTANT f,
           NEW CONSTANT a
    PROVE  f = f /\ a = a

    @type: obligationsnumber
    @count: 1
---*)
