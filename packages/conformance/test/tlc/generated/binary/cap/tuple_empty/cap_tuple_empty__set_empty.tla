(*---
description: cap of tuple_empty, a TupleValue, and set_empty, a SetEnumValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_tuple_empty__set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<>>) \cap ({}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
