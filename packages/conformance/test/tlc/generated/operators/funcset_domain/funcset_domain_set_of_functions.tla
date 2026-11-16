(*---
description: funcset_domain applied to set_of_functions, a SetOfFcnsValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE funcset_domain_set_of_functions ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[{1} -> {2, 3}] -> {9}])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {(<<2>> :> 9 @@ <<3>> :> 9)}"
---*)
