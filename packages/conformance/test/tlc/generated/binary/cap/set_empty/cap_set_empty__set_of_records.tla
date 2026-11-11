(*---
description: cap of set_empty, a SetEnumValue, and set_of_records, a SetOfRcdsValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_set_empty__set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \cap ([a : {1, 2}]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
