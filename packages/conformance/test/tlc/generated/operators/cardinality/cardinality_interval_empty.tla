(*---
description: cardinality applied to interval_empty, a IntervalValue.
ref: tlc2/module/FiniteSets.java#Cardinality
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cardinality_interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality(3..1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
