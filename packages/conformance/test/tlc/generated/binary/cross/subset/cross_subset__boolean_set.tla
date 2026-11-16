(*---
description: cross of subset, a SubsetValue, and boolean_set, a SetEnumValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_subset__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SUBSET {1, 2}) \X (BOOLEAN))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { <<{}, FALSE>>,
    |   <<{}, TRUE>>,
    |   <<{1}, FALSE>>,
    |   <<{1}, TRUE>>,
    |   <<{2}, FALSE>>,
    |   <<{2}, TRUE>>,
    |   <<{1, 2}, FALSE>>,
    |   <<{1, 2}, TRUE>> }
---*)
