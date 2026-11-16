(*---
description: record_set of set_of_functions, a SetOfFcnsValue, and cross, a SetOfTuplesValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_set_of_functions__cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : ([{1} -> {2, 3}]), g : ({1, 2} \X {3})])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { [f |-> <<2>>, g |-> <<1, 3>>],
    |   [f |-> <<2>>, g |-> <<2, 3>>],
    |   [f |-> <<3>>, g |-> <<1, 3>>],
    |   [f |-> <<3>>, g |-> <<2, 3>>] }
---*)
