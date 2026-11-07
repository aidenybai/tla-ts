(*---
description: The subexpression !1 of a bounded CHOOSE is its domain.
ref: src/expr/e_deref.ml#deref_num
mode: obligations
outcome: proved
---*)
---- MODULE choose_domain ----
CONSTANT P(_), S
Op == CHOOSE x \in S : P(x)
THEOREM Op!1 = S
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
    @obl: ASSUME NEW CONSTANT P(_),
           NEW CONSTANT S
    PROVE  S = S

    @type: obligationsnumber
    @count: 1
---*)
