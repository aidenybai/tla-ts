(*---
description: function_over applied to union, a UnionValue.
ref: tlc2/value/impl/FcnLambdaValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_over_union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([e \in UNION {{1}, {2}} |-> e])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 2>>"
---*)
