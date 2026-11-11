(*---
description: cap of int, a UserValue, and set_diff, a SetDiffValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_int__set_diff ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Int) \cap ({1, 2} \ {2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1}"
---*)
