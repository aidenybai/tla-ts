(*---
description: function_set of union, a UnionValue, and set_empty, a SetEnumValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_union__set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(UNION {{1}, {2}}) -> ({})])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
