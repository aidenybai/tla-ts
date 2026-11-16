(*---
description: copies_in applied to tuple_empty, a TupleValue.
ref: tlc2/module/Bags.java#CopiesIn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE copies_in_tuple_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CopiesIn(1, <<>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
