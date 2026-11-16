(*---
description: Op!(e) on a CHOOSE substitutes e for the chosen variable in its body.
ref: src/expr/e_deref.ml#deref_inst
mode: obligations
outcome: proved
---*)
---- MODULE instantiate_choose ----
CONSTANT P(_)
Op == CHOOSE x : P(x)
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
