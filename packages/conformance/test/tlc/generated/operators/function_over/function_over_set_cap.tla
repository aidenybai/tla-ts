(*---
description: function_over applied to set_cap, a SetCapValue.
ref: tlc2/value/impl/FcnLambdaValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_over_set_cap ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([e \in {1, 2} \cap {2, 3} |-> e])
====

(*--- recorded
all:
  exit: 0
  transcript: "| (2 :> 2)"
---*)
