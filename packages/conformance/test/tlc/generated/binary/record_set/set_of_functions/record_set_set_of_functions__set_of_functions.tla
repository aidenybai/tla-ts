(*---
description: record_set of set_of_functions, a SetOfFcnsValue, and set_of_functions, a SetOfFcnsValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_set_of_functions__set_of_functions ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : ([{1} -> {2, 3}]), g : ([{1} -> {2, 3}])])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { [f |-> <<2>>, g |-> <<2>>],
    |   [f |-> <<2>>, g |-> <<3>>],
    |   [f |-> <<3>>, g |-> <<2>>],
    |   [f |-> <<3>>, g |-> <<3>>] }
---*)
