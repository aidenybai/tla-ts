(*---
description: funcset_range applied to interval, a IntervalValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE funcset_range_interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([{9} -> 1..3])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {(9 :> 1), (9 :> 2), (9 :> 3)}"
---*)
