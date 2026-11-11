(*---
description: record_set of boolean_set, a SetEnumValue, and interval, a IntervalValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_boolean_set__interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : (BOOLEAN), g : (1..3)])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { [f |-> FALSE, g |-> 1],
    |   [f |-> FALSE, g |-> 2],
    |   [f |-> FALSE, g |-> 3],
    |   [f |-> TRUE, g |-> 1],
    |   [f |-> TRUE, g |-> 2],
    |   [f |-> TRUE, g |-> 3] }
---*)
