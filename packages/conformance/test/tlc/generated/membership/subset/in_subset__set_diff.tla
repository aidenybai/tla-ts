(*---
description: Asks whether set_diff is in subset, a SubsetValue.
ref: tlc2/value/impl/SubsetValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_subset__set_diff ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \ {2}) \in (SUBSET {1, 2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
