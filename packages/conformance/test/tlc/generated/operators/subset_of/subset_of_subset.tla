(*---
description: subset_of applied to subset, a SubsetValue.
ref: tlc2/value/impl/SubsetValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subset_of_subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SUBSET SUBSET {1, 2})
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { {},
    |   {{}},
    |   {{1}},
    |   {{2}},
    |   {{1, 2}},
    |   {{}, {1}},
    |   {{}, {2}},
    |   {{}, {1, 2}},
    |   {{1}, {2}},
    |   {{1}, {1, 2}},
    |   {{2}, {1, 2}},
    |   {{}, {1}, {2}},
    |   {{}, {1}, {1, 2}},
    |   {{}, {2}, {1, 2}},
    |   {{1}, {2}, {1, 2}},
    |   {{}, {1}, {2}, {1, 2}} }
---*)
