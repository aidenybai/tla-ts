(*---
description: cardinality applied to interval, a IntervalValue.
ref: tlc2/module/FiniteSets.java#Cardinality
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cardinality_interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality(1..3))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 3"
---*)
