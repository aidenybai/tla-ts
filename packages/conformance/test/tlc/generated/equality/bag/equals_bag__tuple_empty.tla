(*---
description: Compares bag, a FcnRcdValue, with tuple_empty, a TupleValue.
ref: tlc2/value/impl/FcnRcdValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_bag__tuple_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SetToBag({1})) = (<<>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
