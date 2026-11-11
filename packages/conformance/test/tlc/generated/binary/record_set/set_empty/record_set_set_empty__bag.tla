(*---
description: record_set of set_empty, a SetEnumValue, and bag, a FcnRcdValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_set_empty__bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : ({}), g : (SetToBag({1}))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
