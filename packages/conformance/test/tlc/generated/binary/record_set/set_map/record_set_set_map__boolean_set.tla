(*---
description: record_set of set_map, a SetEnumValue, and boolean_set, a SetEnumValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_set_map__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : ({x + 1 : x \in 1..2}), g : (BOOLEAN)])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { [f |-> 2, g |-> FALSE],
    |   [f |-> 2, g |-> TRUE],
    |   [f |-> 3, g |-> FALSE],
    |   [f |-> 3, g |-> TRUE] }
---*)
