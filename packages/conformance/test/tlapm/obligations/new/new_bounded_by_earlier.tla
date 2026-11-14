(*---
description: A NEW bound may mention a constant declared just before it in the same ASSUME.
ref: src/expr/e_fmt.ml#pp_print_hyp
mode: obligations
outcome: proved
---*)
---- MODULE new_bounded_by_earlier ----
THEOREM ASSUME NEW S, NEW x \in S PROVE x \in S
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 9:3:9:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT S,
           NEW CONSTANT x \in S
    PROVE  x \in S

    @type: obligationsnumber
    @count: 1
---*)
