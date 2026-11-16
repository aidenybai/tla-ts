(*---
description: record_set of set_of_functions, a SetOfFcnsValue, and set_nested, a SetEnumValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_set_of_functions__set_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : ([{1} -> {2, 3}]), g : ({{1}, {}})])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { [f |-> <<2>>, g |-> {}],
    |   [f |-> <<2>>, g |-> {1}],
    |   [f |-> <<3>>, g |-> {}],
    |   [f |-> <<3>>, g |-> {1}] }
---*)
