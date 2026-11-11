(*---
description: Asks whether int_zero is in set_map, a SetEnumValue.
ref: tlc2/value/impl/SetEnumValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_set_map__int_zero ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((0) \in ({x + 1 : x \in 1..2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
