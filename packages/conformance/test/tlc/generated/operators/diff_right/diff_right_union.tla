(*---
description: diff_right applied to union, a UnionValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_right_union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({1, 2} \ UNION {{1}, {2}})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
