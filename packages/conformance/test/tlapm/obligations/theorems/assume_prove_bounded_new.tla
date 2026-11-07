(*---
description: NEW a \in S keeps its bound in the context as NEW CONSTANT a \in S.
ref: src/expr/e_fmt.ml#pp_print_hyp
mode: obligations
outcome: proved
---*)
---- MODULE assume_prove_bounded_new ----
CONSTANT S
THEOREM ASSUME NEW a \in S PROVE a \in S
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
           NEW CONSTANT a \in S
    PROVE  a \in S

    @type: obligationsnumber
    @count: 1
---*)
