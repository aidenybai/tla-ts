(*---
description: head applied to tuple_mixed, a TupleValue.
ref: tlc2/module/Sequences.java#Head
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE head_tuple_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(<<1, "a", {TRUE}>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
