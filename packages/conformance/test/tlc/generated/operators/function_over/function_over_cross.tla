(*---
description: function_over applied to cross, a SetOfTuplesValue.
ref: tlc2/value/impl/FcnLambdaValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_over_cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([e \in {1, 2} \X {3} |-> e])
====

(*--- recorded
all:
  exit: 0
  transcript: "| (<<1, 3>> :> <<1, 3>> @@ <<2, 3>> :> <<2, 3>>)"
---*)
