(*---
description: Op!(e, f) instantiates both bound variables of a quantifier.
ref: src/expr/e_deref.ml#deref_inst
mode: obligations
outcome: proved
---*)
---- MODULE instantiate_two_variables ----
CONSTANT P(_, _)
Op == \E x, y : P(x, y)
THEOREM Op!(1, 2)
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
    @obl: ASSUME NEW CONSTANT P(_, _)
    PROVE  P(1, 2)

    @type: obligationsnumber
    @count: 1
---*)
