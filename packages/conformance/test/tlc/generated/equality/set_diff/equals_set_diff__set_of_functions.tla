(*---
description: Compares set_diff, a SetDiffValue, with set_of_functions, a SetOfFcnsValue.
ref: tlc2/value/impl/SetDiffValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_set_diff__set_of_functions ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \ {2}) = ([{1} -> {2, 3}]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
