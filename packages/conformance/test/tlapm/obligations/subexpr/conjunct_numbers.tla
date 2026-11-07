(*---
description: Op!1 and Op!2 name the operands of the top-level operator of Op's body.
ref: src/expr/e_deref.ml#deref_num
mode: obligations
outcome: proved
---*)
---- MODULE conjunct_numbers ----
CONSTANT A, B
Op == A /\ B
THEOREM Op!2 /\ Op!1
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
    PROVE  B /\ A

    @type: obligationsnumber
    @count: 1
---*)
