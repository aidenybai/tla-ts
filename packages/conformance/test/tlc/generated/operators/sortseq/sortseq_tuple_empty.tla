(*---
description: sortseq applied to tuple_empty, a TupleValue.
ref: tlc2/module/TLC.java#SortSeq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE sortseq_tuple_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(<<>>, LAMBDA a, b : a < b))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
