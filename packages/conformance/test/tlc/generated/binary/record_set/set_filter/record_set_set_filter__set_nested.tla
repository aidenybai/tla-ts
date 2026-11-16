(*---
description: record_set of set_filter, a SetPredValue, and set_nested, a SetEnumValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_set_filter__set_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : ({x \in 1..3 : x > 1}), g : ({{1}, {}})])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { [f |-> 2, g |-> {}],
    |   [f |-> 2, g |-> {1}],
    |   [f |-> 3, g |-> {}],
    |   [f |-> 3, g |-> {1}] }
---*)
