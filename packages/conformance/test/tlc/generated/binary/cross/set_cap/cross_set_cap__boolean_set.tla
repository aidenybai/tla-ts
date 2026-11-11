(*---
description: cross of set_cap, a SetCapValue, and boolean_set, a SetEnumValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_set_cap__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \cap {2, 3}) \X (BOOLEAN))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<2, FALSE>>, <<2, TRUE>>}"
---*)
