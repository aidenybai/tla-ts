(*---
description: diff of set_filter, a SetPredValue, and int, a UserValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_set_filter__int ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({x \in 1..3 : x > 1}) \ (Int))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
