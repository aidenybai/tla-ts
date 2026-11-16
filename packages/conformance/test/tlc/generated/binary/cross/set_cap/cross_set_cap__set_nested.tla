(*---
description: cross of set_cap, a SetCapValue, and set_nested, a SetEnumValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_set_cap__set_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \cap {2, 3}) \X ({{1}, {}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<2, {}>>, <<2, {1}>>}"
---*)
