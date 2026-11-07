(*---
description: Asks whether int_minimum is in set_ints, a SetEnumValue.
ref: tlc2/value/impl/SetEnumValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_set_ints__int_minimum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-2147483647 - 1)) \in ({2, 1}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
