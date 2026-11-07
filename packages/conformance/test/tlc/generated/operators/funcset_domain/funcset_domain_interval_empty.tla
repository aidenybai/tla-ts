(*---
description: funcset_domain applied to interval_empty, a IntervalValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE funcset_domain_interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([3..1 -> {9}])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<>>}"
---*)
