(*---
description: function_set of subset, a SubsetValue, and set_cap, a SetCapValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_subset__set_cap ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(SUBSET {1, 2}) -> ({1, 2} \cap {2, 3})])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {({} :> 2 @@ {1} :> 2 @@ {2} :> 2 @@ {1, 2} :> 2)}"
---*)
