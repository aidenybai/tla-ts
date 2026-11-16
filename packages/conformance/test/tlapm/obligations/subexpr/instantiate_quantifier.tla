(*---
description: Op!(e) instantiates the bound variable of a quantified body with e.
ref: src/expr/e_deref.ml#deref_inst
mode: obligations
outcome: proved
---*)
---- MODULE instantiate_quantifier ----
CONSTANT P(_)
Op == \A x : P(x)
THEOREM Op!(1)
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
    @obl: ASSUME NEW CONSTANT P(_)
    PROVE  P(1)

    @type: obligationsnumber
    @count: 1
---*)
