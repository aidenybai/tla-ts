(*---
description: function_over applied to subset, a SubsetValue.
ref: tlc2/value/impl/FcnLambdaValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_over_subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([e \in SUBSET {1, 2} |-> e])
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({} :> {} @@ {1} :> {1} @@ {2} :> {2} @@ {1, 2} :> {1, 2})"
---*)
