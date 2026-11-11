(*---
description: diff of set_empty, a SetEnumValue, and bag, a FcnRcdValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_set_empty__bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \ (SetToBag({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
