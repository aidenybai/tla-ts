(*---
description: record_set of interval, a IntervalValue, and boolean_set, a SetEnumValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_interval__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : (1..3), g : (BOOLEAN)])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { [f |-> 1, g |-> FALSE],
    |   [f |-> 1, g |-> TRUE],
    |   [f |-> 2, g |-> FALSE],
    |   [f |-> 2, g |-> TRUE],
    |   [f |-> 3, g |-> FALSE],
    |   [f |-> 3, g |-> TRUE] }
---*)
