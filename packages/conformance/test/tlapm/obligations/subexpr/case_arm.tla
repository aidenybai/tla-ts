(*---
description: A numbered subexpression of CASE is the pair of a guard and its value.
ref: src/expr/e_deref.ml#deref_num
mode: obligations
outcome: proved
---*)
---- MODULE case_arm ----
CONSTANT A, B
Op == CASE A -> 1 [] B -> 2
THEOREM Op!2 = <<B, 2>>
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
    @obl: ASSUME NEW CONSTANT A,
           NEW CONSTANT B
    PROVE  <<B, 2>> = <<B, 2>>

    @type: obligationsnumber
    @count: 1
---*)
