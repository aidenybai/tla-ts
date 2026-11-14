(*---
description: Op!(e) on a set filter substitutes e in its predicate.
ref: src/expr/e_deref.ml#deref_inst
mode: obligations
outcome: proved
---*)
---- MODULE instantiate_set_filter ----
CONSTANT P(_), S
Op == {x \in S : P(x)}
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
    @obl: ASSUME NEW CONSTANT P(_),
           NEW CONSTANT S
    PROVE  P(1)

    @type: obligationsnumber
    @count: 1
---*)
