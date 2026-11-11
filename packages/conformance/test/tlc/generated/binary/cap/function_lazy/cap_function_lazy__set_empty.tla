(*---
description: cap of function_lazy, a FcnLambdaValue, and set_empty, a SetEnumValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_function_lazy__set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in Nat |-> x]) \cap ({}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
