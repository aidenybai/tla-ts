(*---
description: diff_left applied to set_filter, a SetPredValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_left_set_filter ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({x \in 1..3 : x > 1} \ {1})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {2, 3}"
---*)
