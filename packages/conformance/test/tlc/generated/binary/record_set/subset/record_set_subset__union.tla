(*---
description: record_set of subset, a SubsetValue, and union, a UnionValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_subset__union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : (SUBSET {1, 2}), g : (UNION {{1}, {2}})])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { [f |-> {}, g |-> 1],
    |   [f |-> {}, g |-> 2],
    |   [f |-> {1}, g |-> 1],
    |   [f |-> {1}, g |-> 2],
    |   [f |-> {2}, g |-> 1],
    |   [f |-> {2}, g |-> 2],
    |   [f |-> {1, 2}, g |-> 1],
    |   [f |-> {1, 2}, g |-> 2] }
---*)
