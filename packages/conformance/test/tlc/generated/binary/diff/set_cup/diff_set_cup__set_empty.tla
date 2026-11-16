(*---
description: diff of set_cup, a SetCupValue, and set_empty, a SetEnumValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_set_cup__set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1} \cup {2}) \ ({}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2}"
---*)
