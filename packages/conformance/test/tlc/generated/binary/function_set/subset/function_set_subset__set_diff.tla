(*---
description: function_set of subset, a SubsetValue, and set_diff, a SetDiffValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_subset__set_diff ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(SUBSET {1, 2}) -> ({1, 2} \ {2})])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {({} :> 1 @@ {1} :> 1 @@ {2} :> 1 @@ {1, 2} :> 1)}"
---*)
