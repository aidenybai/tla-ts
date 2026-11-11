(*---
description: Compares set_empty, a SetEnumValue, with set_filter, a SetPredValue.
ref: tlc2/value/impl/SetEnumValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_set_empty__set_filter ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) = ({x \in 1..3 : x > 1}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
