(*---
description: copies_in applied to tuple_mixed, a TupleValue.
ref: tlc2/module/Bags.java#CopiesIn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE copies_in_tuple_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CopiesIn(1, <<1, "a", {TRUE}>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
