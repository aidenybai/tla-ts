(*---
description: Asks whether set_ints is in subset, a SubsetValue.
ref: tlc2/value/impl/SubsetValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_subset__set_ints ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({2, 1}) \in (SUBSET {1, 2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
