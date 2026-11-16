(*---
description: selectseq applied to double_at, a FcnRcdValue.
ref: tlc2/module/Sequences.java#SelectSeq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE selectseq_double_at ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq((1 :> 2) @@ (2 :> 3), LAMBDA e : TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, 3>>"
---*)
