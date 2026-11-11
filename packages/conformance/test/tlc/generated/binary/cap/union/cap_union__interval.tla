(*---
description: cap of union, a UnionValue, and interval, a IntervalValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_union__interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{1}, {2}}) \cap (1..3))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2}"
---*)
