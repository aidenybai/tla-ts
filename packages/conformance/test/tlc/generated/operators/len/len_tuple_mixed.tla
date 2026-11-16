(*---
description: len applied to tuple_mixed, a TupleValue.
ref: tlc2/module/Sequences.java#Len
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE len_tuple_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(<<1, "a", {TRUE}>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 3"
---*)
