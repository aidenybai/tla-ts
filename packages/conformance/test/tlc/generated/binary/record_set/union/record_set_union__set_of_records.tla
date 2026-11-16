(*---
description: record_set of union, a UnionValue, and set_of_records, a SetOfRcdsValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_union__set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : (UNION {{1}, {2}}), g : ([a : {1, 2}])])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { [f |-> 1, g |-> [a |-> 1]],
    |   [f |-> 1, g |-> [a |-> 2]],
    |   [f |-> 2, g |-> [a |-> 1]],
    |   [f |-> 2, g |-> [a |-> 2]] }
---*)
