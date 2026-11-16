(*---
description: NEW STATE with arguments declares a state-level operator with its shape.
ref: src/expr/e_fmt.ml#pp_print_shape
mode: obligations
outcome: proved
---*)
---- MODULE assume_prove_state_operator ----
THEOREM ASSUME NEW STATE P(_), NEW ACTION Q(_, _) PROVE P(1) => P(1)
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
    @obl: ASSUME NEW STATE P(_),
           NEW ACTION Q(_, _)
    PROVE  P(1) => P(1)

    @type: obligationsnumber
    @count: 1
---*)
