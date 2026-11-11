(*---
description: cardinality applied to cross, a SetOfTuplesValue.
ref: tlc2/module/FiniteSets.java#Cardinality
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cardinality_cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality({1, 2} \X {3}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
