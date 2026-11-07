(*---
description: function_over applied to interval_empty, a IntervalValue.
ref: tlc2/value/impl/FcnLambdaValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_over_interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([e \in 3..1 |-> e])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
