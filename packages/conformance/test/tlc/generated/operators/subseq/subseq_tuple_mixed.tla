(*---
description: subseq applied to tuple_mixed, a TupleValue.
ref: tlc2/module/Sequences.java#SubSeq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseq_tuple_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(<<1, "a", {TRUE}>>, 1, 1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1>>"
---*)
