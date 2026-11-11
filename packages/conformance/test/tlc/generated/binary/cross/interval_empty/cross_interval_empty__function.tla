(*---
description: cross of interval_empty, a IntervalValue, and function, a FcnRcdValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_interval_empty__function ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((3..1) \X ([x \in {1, 2} |-> x * 2]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
