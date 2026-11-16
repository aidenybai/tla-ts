(*---
description: record_set of boolean_set, a SetEnumValue, and set_map, a SetEnumValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_boolean_set__set_map ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : (BOOLEAN), g : ({x + 1 : x \in 1..2})])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { [f |-> FALSE, g |-> 2],
    |   [f |-> FALSE, g |-> 3],
    |   [f |-> TRUE, g |-> 2],
    |   [f |-> TRUE, g |-> 3] }
---*)
