(*---
description: diff of set_empty, a SetEnumValue, and function_lazy, a FcnLambdaValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_set_empty__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \ ([x \in Nat |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
