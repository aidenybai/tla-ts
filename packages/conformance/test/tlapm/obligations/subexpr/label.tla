(*---
description: Op!lab names the subexpression labelled lab.
ref: src/expr/e_deref.ml#deref_label
mode: obligations
outcome: proved
---*)
---- MODULE label ----
CONSTANT A, B
Op == A /\ lab :: B
THEOREM Op!lab
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
    PROVE  B

    @type: obligationsnumber
    @count: 1
---*)
