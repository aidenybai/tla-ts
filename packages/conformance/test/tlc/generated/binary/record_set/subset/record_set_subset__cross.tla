(*---
description: record_set of subset, a SubsetValue, and cross, a SetOfTuplesValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_subset__cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : (SUBSET {1, 2}), g : ({1, 2} \X {3})])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { [f |-> {}, g |-> <<1, 3>>],
    |   [f |-> {}, g |-> <<2, 3>>],
    |   [f |-> {1}, g |-> <<1, 3>>],
    |   [f |-> {1}, g |-> <<2, 3>>],
    |   [f |-> {2}, g |-> <<1, 3>>],
    |   [f |-> {2}, g |-> <<2, 3>>],
    |   [f |-> {1, 2}, g |-> <<1, 3>>],
    |   [f |-> {1, 2}, g |-> <<2, 3>>] }
---*)
