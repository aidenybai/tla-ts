(*---
description: NEW CONSTANT and CONSTANT without NEW both declare a constant in an ASSUME.
ref: src/expr/e_parser.ml#hyp
mode: obligations
outcome: proved
---*)
---- MODULE assume_prove_constant_keyword ----
THEOREM ASSUME NEW CONSTANT a, CONSTANT b PROVE a = b => b = a
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
    @obl: ASSUME NEW CONSTANT a,
           NEW CONSTANT b
    PROVE  a = b => b = a

    @type: obligationsnumber
    @count: 1
---*)
