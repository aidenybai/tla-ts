(*---
description: funcset_domain applied to set_empty, a SetEnumValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE funcset_domain_set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([{} -> {9}])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<>>}"
---*)
