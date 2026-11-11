(*---
description: cross of set_cup, a SetCupValue, and boolean_set, a SetEnumValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_set_cup__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1} \cup {2}) \X (BOOLEAN))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<1, FALSE>>, <<1, TRUE>>, <<2, FALSE>>, <<2, TRUE>>}"
---*)
