(*---
description: Op!<< and Op!>> name the first and second operands.
ref: src/expr/e_deref.ml#deref
mode: obligations
outcome: proved
---*)
---- MODULE left_right ----
CONSTANT A, B
Op == A => B
THEOREM Op!>> => Op!<<
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
    PROVE  B => A

    @type: obligationsnumber
    @count: 1
---*)
