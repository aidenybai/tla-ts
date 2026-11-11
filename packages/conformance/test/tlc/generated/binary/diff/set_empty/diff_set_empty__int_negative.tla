(*---
description: diff of set_empty, a SetEnumValue, and int_negative, a IntValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_set_empty__int_negative ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \ (-3))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
