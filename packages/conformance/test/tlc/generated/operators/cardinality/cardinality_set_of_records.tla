(*---
description: cardinality applied to set_of_records, a SetOfRcdsValue.
ref: tlc2/module/FiniteSets.java#Cardinality
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cardinality_set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality([a : {1, 2}]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
