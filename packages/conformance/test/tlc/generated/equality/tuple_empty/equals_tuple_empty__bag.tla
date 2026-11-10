(*---
description: Compares tuple_empty, a TupleValue, with bag, a FcnRcdValue.
ref: tlc2/value/impl/TupleValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_tuple_empty__bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<>>) = (SetToBag({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
