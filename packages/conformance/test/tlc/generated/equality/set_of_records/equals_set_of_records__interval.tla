(*---
description: Compares set_of_records, a SetOfRcdsValue, with interval, a IntervalValue.
ref: tlc2/value/impl/SetOfRcdsValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_set_of_records__interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a : {1, 2}]) = (1..3))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
