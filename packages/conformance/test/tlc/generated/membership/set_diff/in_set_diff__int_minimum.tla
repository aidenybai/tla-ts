(*---
description: Asks whether int_minimum is in set_diff, a SetDiffValue.
ref: tlc2/value/impl/SetDiffValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_set_diff__int_minimum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-2147483647 - 1)) \in ({1, 2} \ {2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
