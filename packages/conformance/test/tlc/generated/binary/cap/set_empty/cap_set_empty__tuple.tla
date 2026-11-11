(*---
description: cap of set_empty, a SetEnumValue, and tuple, a TupleValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_set_empty__tuple ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \cap (<<1, 2>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
