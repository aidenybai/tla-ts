(*---
description: sortseq applied to function_empty, a FcnRcdValue.
ref: tlc2/module/TLC.java#SortSeq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE sortseq_function_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq([x \in {} |-> x], LAMBDA a, b : a < b))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
