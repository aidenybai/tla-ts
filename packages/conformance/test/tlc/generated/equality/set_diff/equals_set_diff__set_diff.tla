(*---
description: Compares set_diff, a SetDiffValue, with set_diff, a SetDiffValue.
ref: tlc2/value/impl/SetDiffValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_set_diff__set_diff ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \ {2}) = ({1, 2} \ {2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
