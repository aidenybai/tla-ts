(*---
description: copies_in applied to tuple, a TupleValue.
ref: tlc2/module/Bags.java#CopiesIn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE copies_in_tuple ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CopiesIn(1, <<1, 2>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
