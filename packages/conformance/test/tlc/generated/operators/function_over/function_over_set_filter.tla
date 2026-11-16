(*---
description: function_over applied to set_filter, a SetPredValue.
ref: tlc2/value/impl/FcnLambdaValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_over_set_filter ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([e \in {x \in 1..3 : x > 1} |-> e])
====

(*--- recorded
all:
  exit: 0
  transcript: "| (2 :> 2 @@ 3 :> 3)"
---*)
