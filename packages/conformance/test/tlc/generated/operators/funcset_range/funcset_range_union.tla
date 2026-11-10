(*---
description: funcset_range applied to union, a UnionValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE funcset_range_union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([{9} -> UNION {{1}, {2}}])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {(9 :> 1), (9 :> 2)}"
---*)
