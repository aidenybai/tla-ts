(*---
description: funcset_domain applied to set_of_records, a SetOfRcdsValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE funcset_domain_set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a : {1, 2}] -> {9}])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {([a |-> 1] :> 9 @@ [a |-> 2] :> 9)}"
---*)
