(*---
description: record_set of set_empty, a SetEnumValue, and tuple_mixed, a TupleValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_set_empty__tuple_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : ({}), g : (<<1, "a", {TRUE}>>)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
