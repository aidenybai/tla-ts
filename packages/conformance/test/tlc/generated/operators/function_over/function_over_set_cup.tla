(*---
description: function_over applied to set_cup, a SetCupValue.
ref: tlc2/value/impl/FcnLambdaValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_over_set_cup ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([e \in {1} \cup {2} |-> e])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 2>>"
---*)
