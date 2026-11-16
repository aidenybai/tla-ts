(*---
description: sortseq applied to tuple, a TupleValue.
ref: tlc2/module/TLC.java#SortSeq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE sortseq_tuple ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(<<1, 2>>, LAMBDA a, b : a < b))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 2>>"
---*)
