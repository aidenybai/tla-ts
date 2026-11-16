(*---
description: cross of boolean_set, a SetEnumValue, and subset, a SubsetValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_boolean_set__subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((BOOLEAN) \X (SUBSET {1, 2}))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { <<FALSE, {}>>,
    |   <<FALSE, {1}>>,
    |   <<FALSE, {2}>>,
    |   <<FALSE, {1, 2}>>,
    |   <<TRUE, {}>>,
    |   <<TRUE, {1}>>,
    |   <<TRUE, {2}>>,
    |   <<TRUE, {1, 2}>> }
---*)
