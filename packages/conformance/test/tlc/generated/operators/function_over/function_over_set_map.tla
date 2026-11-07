(*---
description: function_over applied to set_map, a SetEnumValue.
ref: tlc2/value/impl/FcnLambdaValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_over_set_map ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([e \in {x + 1 : x \in 1..2} |-> e])
====

(*--- recorded
all:
  exit: 0
  transcript: "| (2 :> 2 @@ 3 :> 3)"
---*)
