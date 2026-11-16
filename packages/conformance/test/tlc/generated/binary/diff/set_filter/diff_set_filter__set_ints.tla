(*---
description: diff of set_filter, a SetPredValue, and set_ints, a SetEnumValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_set_filter__set_ints ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({x \in 1..3 : x > 1}) \ ({2, 1}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {3}"
---*)
