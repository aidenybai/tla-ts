(*---
description: diff of set_cup, a SetCupValue, and interval, a IntervalValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_set_cup__interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1} \cup {2}) \ (1..3))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
