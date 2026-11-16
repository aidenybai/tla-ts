(*---
description: cap of interval, a IntervalValue, and set_diff, a SetDiffValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_interval__set_diff ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1..3) \cap ({1, 2} \ {2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1}"
---*)
