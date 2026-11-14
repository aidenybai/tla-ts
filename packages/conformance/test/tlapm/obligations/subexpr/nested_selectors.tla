(*---
description: Selectors compose, so Op!2!1 is the first operand of the second operand.
ref: src/expr/e_deref.ml#deref
mode: obligations
outcome: proved
---*)
---- MODULE nested_selectors ----
CONSTANT A, B, C
Op == A /\ (B \/ C)
THEOREM Op!2!1
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
           NEW CONSTANT B,
           NEW CONSTANT C
    PROVE  B

    @type: obligationsnumber
    @count: 1
---*)
