(*---
description: The three subexpressions of IF are its condition and its two branches.
ref: src/expr/e_deref.ml#deref_num
mode: obligations
outcome: proved
---*)
---- MODULE if_parts ----
CONSTANT A, B, C
Op == IF A THEN B ELSE C
THEOREM Op!1 /\ Op!2 /\ Op!3
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
    PROVE  A /\ B /\ C

    @type: obligationsnumber
    @count: 1
---*)
