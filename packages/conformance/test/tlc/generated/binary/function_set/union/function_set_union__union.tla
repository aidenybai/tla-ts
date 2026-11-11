(*---
description: function_set of union, a UnionValue, and union, a UnionValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_union__union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(UNION {{1}, {2}}) -> (UNION {{1}, {2}})])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<1, 1>>, <<1, 2>>, <<2, 1>>, <<2, 2>>}"
---*)
