(*---
description: cross of subset, a SubsetValue, and subset, a SubsetValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_subset__subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SUBSET {1, 2}) \X (SUBSET {1, 2}))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { <<{}, {}>>,
    |   <<{}, {1}>>,
    |   <<{}, {2}>>,
    |   <<{}, {1, 2}>>,
    |   <<{1}, {}>>,
    |   <<{1}, {1}>>,
    |   <<{1}, {2}>>,
    |   <<{1}, {1, 2}>>,
    |   <<{2}, {}>>,
    |   <<{2}, {1}>>,
    |   <<{2}, {2}>>,
    |   <<{2}, {1, 2}>>,
    |   <<{1, 2}, {}>>,
    |   <<{1, 2}, {1}>>,
    |   <<{1, 2}, {2}>>,
    |   <<{1, 2}, {1, 2}>> }
---*)
