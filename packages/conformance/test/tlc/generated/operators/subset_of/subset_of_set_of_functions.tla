(*---
description: subset_of applied to set_of_functions, a SetOfFcnsValue.
ref: tlc2/value/impl/SubsetValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subset_of_set_of_functions ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SUBSET [{1} -> {2, 3}])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {{}, {<<2>>}, {<<3>>}, {<<2>>, <<3>>}}"
---*)
