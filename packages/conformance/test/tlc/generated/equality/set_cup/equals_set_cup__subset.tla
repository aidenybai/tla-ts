(*---
description: Compares set_cup, a SetCupValue, with subset, a SubsetValue.
ref: tlc2/value/impl/SetCupValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_set_cup__subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1} \cup {2}) = (SUBSET {1, 2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
