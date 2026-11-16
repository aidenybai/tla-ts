(*---
description: record_set of interval, a IntervalValue, and set_ints, a SetEnumValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_interval__set_ints ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : (1..3), g : ({2, 1})])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { [f |-> 1, g |-> 1],
    |   [f |-> 1, g |-> 2],
    |   [f |-> 2, g |-> 1],
    |   [f |-> 2, g |-> 2],
    |   [f |-> 3, g |-> 1],
    |   [f |-> 3, g |-> 2] }
---*)
