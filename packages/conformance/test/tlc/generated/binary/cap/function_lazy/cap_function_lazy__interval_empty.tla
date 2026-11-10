(*---
description: cap of function_lazy, a FcnLambdaValue, and interval_empty, a IntervalValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_function_lazy__interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in Nat |-> x]) \cap (3..1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
