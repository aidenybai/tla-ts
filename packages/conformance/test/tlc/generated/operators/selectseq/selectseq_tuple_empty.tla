(*---
description: selectseq applied to tuple_empty, a TupleValue.
ref: tlc2/module/Sequences.java#SelectSeq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE selectseq_tuple_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(<<>>, LAMBDA e : TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
