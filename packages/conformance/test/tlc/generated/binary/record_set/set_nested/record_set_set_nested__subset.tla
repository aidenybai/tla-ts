(*---
description: record_set of set_nested, a SetEnumValue, and subset, a SubsetValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_set_nested__subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : ({{1}, {}}), g : (SUBSET {1, 2})])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { [f |-> {}, g |-> {}],
    |   [f |-> {}, g |-> {1}],
    |   [f |-> {}, g |-> {2}],
    |   [f |-> {}, g |-> {1, 2}],
    |   [f |-> {1}, g |-> {}],
    |   [f |-> {1}, g |-> {1}],
    |   [f |-> {1}, g |-> {2}],
    |   [f |-> {1}, g |-> {1, 2}] }
---*)
