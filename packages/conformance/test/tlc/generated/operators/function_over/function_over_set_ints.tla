(*---
description: function_over applied to set_ints, a SetEnumValue.
ref: tlc2/value/impl/FcnLambdaValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_over_set_ints ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([e \in {2, 1} |-> e])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 2>>"
---*)
