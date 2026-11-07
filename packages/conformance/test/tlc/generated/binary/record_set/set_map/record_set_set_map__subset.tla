(*---
description: record_set of set_map, a SetEnumValue, and subset, a SubsetValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_set_map__subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : ({x + 1 : x \in 1..2}), g : (SUBSET {1, 2})])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { [f |-> 2, g |-> {}],
    |   [f |-> 2, g |-> {1}],
    |   [f |-> 2, g |-> {2}],
    |   [f |-> 2, g |-> {1, 2}],
    |   [f |-> 3, g |-> {}],
    |   [f |-> 3, g |-> {1}],
    |   [f |-> 3, g |-> {2}],
    |   [f |-> 3, g |-> {1, 2}] }
---*)
