(*---
description: NEW x \in SUBSET S keeps its bound.
ref: src/expr/e_fmt.ml#pp_print_hyp
mode: obligations
outcome: proved
---*)
---- MODULE new_bounded_subset ----
CONSTANT S
THEOREM ASSUME NEW x \in SUBSET S PROVE x \subseteq S
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 10:3:10:10
    @status: to be proved
    @obl: ASSUME NEW CONSTANT S,
           NEW CONSTANT x \in SUBSET S
    PROVE  x \subseteq S

    @type: obligationsnumber
    @count: 1
---*)
