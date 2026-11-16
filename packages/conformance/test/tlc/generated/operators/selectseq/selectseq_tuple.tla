(*---
description: selectseq applied to tuple, a TupleValue.
ref: tlc2/module/Sequences.java#SelectSeq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE selectseq_tuple ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(<<1, 2>>, LAMBDA e : TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 2>>"
---*)
