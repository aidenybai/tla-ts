(*---
description: record_set of boolean_set, a SetEnumValue, and subset, a SubsetValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_boolean_set__subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : (BOOLEAN), g : (SUBSET {1, 2})])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { [f |-> FALSE, g |-> {}],
    |   [f |-> FALSE, g |-> {1}],
    |   [f |-> FALSE, g |-> {2}],
    |   [f |-> FALSE, g |-> {1, 2}],
    |   [f |-> TRUE, g |-> {}],
    |   [f |-> TRUE, g |-> {1}],
    |   [f |-> TRUE, g |-> {2}],
    |   [f |-> TRUE, g |-> {1, 2}] }
---*)
