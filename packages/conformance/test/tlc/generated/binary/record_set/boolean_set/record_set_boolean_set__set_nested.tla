(*---
description: record_set of boolean_set, a SetEnumValue, and set_nested, a SetEnumValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_boolean_set__set_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : (BOOLEAN), g : ({{1}, {}})])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { [f |-> FALSE, g |-> {}],
    |   [f |-> FALSE, g |-> {1}],
    |   [f |-> TRUE, g |-> {}],
    |   [f |-> TRUE, g |-> {1}] }
---*)
