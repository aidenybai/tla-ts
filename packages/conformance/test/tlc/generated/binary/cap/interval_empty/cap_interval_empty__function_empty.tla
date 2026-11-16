(*---
description: cap of interval_empty, a IntervalValue, and function_empty, a FcnRcdValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_interval_empty__function_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((3..1) \cap ([x \in {} |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
