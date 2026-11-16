(*---
description: record_set of boolean_set, a SetEnumValue, and boolean_set, a SetEnumValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_boolean_set__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : (BOOLEAN), g : (BOOLEAN)])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { [f |-> FALSE, g |-> FALSE],
    |   [f |-> FALSE, g |-> TRUE],
    |   [f |-> TRUE, g |-> FALSE],
    |   [f |-> TRUE, g |-> TRUE] }
---*)
