(*---
description: function_over applied to boolean_set, a SetEnumValue.
ref: tlc2/value/impl/FcnLambdaValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_over_boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([e \in BOOLEAN |-> e])
====

(*--- recorded
all:
  exit: 0
  transcript: "| (FALSE :> FALSE @@ TRUE :> TRUE)"
---*)
