(*---
description: cardinality applied to set_cup, a SetCupValue.
ref: tlc2/module/FiniteSets.java#Cardinality
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cardinality_set_cup ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality({1} \cup {2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
