(*---
description: sortseq applied to double_at, a FcnRcdValue.
ref: tlc2/module/TLC.java#SortSeq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE sortseq_double_at ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq((1 :> 2) @@ (2 :> 3), LAMBDA a, b : a < b))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, 3>>"
---*)
