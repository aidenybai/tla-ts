(*---
description: function_over applied to set_of_functions, a SetOfFcnsValue.
ref: tlc2/value/impl/FcnLambdaValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_over_set_of_functions ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([e \in [{1} -> {2, 3}] |-> e])
====

(*--- recorded
all:
  exit: 0
  transcript: "| (<<2>> :> <<2>> @@ <<3>> :> <<3>>)"
---*)
