(*---
description: cap of set_empty, a SetEnumValue, and function_lazy, a FcnLambdaValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_set_empty__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \cap ([x \in Nat |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
