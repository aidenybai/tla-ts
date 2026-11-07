(*---
description: A NEW declaration without a kind is a CONSTANT.
ref: src/expr/e_parser.ml#hyp
mode: obligations
outcome: proved
---*)
---- MODULE assume_prove_new_default_kind ----
THEOREM ASSUME NEW a PROVE a = a
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
    @obl: ASSUME NEW CONSTANT a
    PROVE  a = a

    @type: obligationsnumber
    @count: 1
---*)
