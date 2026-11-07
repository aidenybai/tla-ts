(*---
description: selectseq applied to tuple_mixed, a TupleValue.
ref: tlc2/module/Sequences.java#SelectSeq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE selectseq_tuple_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(<<1, "a", {TRUE}>>, LAMBDA e : TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<1, "a", {TRUE}>>'
---*)
