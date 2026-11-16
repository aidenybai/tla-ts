(*---
description: funcset_domain applied to subset, a SubsetValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE funcset_domain_subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SUBSET {1, 2} -> {9}])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {({} :> 9 @@ {1} :> 9 @@ {2} :> 9 @@ {1, 2} :> 9)}"
---*)
