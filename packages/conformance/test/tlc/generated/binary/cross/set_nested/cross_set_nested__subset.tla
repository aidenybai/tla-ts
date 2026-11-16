(*---
description: cross of set_nested, a SetEnumValue, and subset, a SubsetValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_set_nested__subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({{1}, {}}) \X (SUBSET {1, 2}))
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
    |   <<{1}, {1, 2}>> }
---*)
