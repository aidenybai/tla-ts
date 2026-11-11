(*---
description: Asks whether set_empty is in subset, a SubsetValue.
ref: tlc2/value/impl/SubsetValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_subset__set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \in (SUBSET {1, 2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
