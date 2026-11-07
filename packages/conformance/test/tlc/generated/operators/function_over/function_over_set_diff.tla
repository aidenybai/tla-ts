(*---
description: function_over applied to set_diff, a SetDiffValue.
ref: tlc2/value/impl/FcnLambdaValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_over_set_diff ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([e \in {1, 2} \ {2} |-> e])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1>>"
---*)
