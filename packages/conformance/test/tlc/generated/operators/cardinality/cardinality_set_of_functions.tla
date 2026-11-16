(*---
description: cardinality applied to set_of_functions, a SetOfFcnsValue.
ref: tlc2/module/FiniteSets.java#Cardinality
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cardinality_set_of_functions ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality([{1} -> {2, 3}]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
