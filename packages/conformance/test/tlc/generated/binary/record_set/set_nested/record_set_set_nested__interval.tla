(*---
description: record_set of set_nested, a SetEnumValue, and interval, a IntervalValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_set_nested__interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : ({{1}, {}}), g : (1..3)])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { [f |-> {}, g |-> 1],
    |   [f |-> {}, g |-> 2],
    |   [f |-> {}, g |-> 3],
    |   [f |-> {1}, g |-> 1],
    |   [f |-> {1}, g |-> 2],
    |   [f |-> {1}, g |-> 3] }
---*)
