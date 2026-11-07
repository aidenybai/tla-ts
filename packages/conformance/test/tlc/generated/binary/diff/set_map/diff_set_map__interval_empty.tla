(*---
description: diff of set_map, a SetEnumValue, and interval_empty, a IntervalValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_set_map__interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({x + 1 : x \in 1..2}) \ (3..1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {2, 3}"
---*)
