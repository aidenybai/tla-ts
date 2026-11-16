(*---
description: cup of set_diff, a SetDiffValue, and set_diff, a SetDiffValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_set_diff__set_diff ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \ {2}) \cup ({1, 2} \ {2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1}"
---*)
