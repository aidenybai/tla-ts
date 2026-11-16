(*---
description: funcset_domain applied to interval, a IntervalValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE funcset_domain_interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([1..3 -> {9}])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<9, 9, 9>>}"
---*)
