(*---
description: filter_over applied to set_nested, a SetEnumValue.
ref: tlc2/value/impl/SetPredValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE filter_over_set_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({e \in {{1}, {}} : TRUE})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {{}, {1}}"
---*)
