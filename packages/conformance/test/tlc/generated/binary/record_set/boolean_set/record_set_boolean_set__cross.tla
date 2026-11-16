(*---
description: record_set of boolean_set, a SetEnumValue, and cross, a SetOfTuplesValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_boolean_set__cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : (BOOLEAN), g : ({1, 2} \X {3})])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { [f |-> FALSE, g |-> <<1, 3>>],
    |   [f |-> FALSE, g |-> <<2, 3>>],
    |   [f |-> TRUE, g |-> <<1, 3>>],
    |   [f |-> TRUE, g |-> <<2, 3>>] }
---*)
