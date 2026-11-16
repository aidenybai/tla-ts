(*---
description: record_set of set_empty, a SetEnumValue, and set_diff, a SetDiffValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_set_empty__set_diff ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : ({}), g : ({1, 2} \ {2})])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
