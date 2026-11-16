(*---
description: funcset_domain applied to union, a UnionValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE funcset_domain_union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([UNION {{1}, {2}} -> {9}])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<9, 9>>}"
---*)
