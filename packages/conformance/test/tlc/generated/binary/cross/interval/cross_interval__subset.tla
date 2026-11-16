(*---
description: cross of interval, a IntervalValue, and subset, a SubsetValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_interval__subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1..3) \X (SUBSET {1, 2}))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { <<1, {}>>,
    |   <<1, {1}>>,
    |   <<1, {2}>>,
    |   <<1, {1, 2}>>,
    |   <<2, {}>>,
    |   <<2, {1}>>,
    |   <<2, {2}>>,
    |   <<2, {1, 2}>>,
    |   <<3, {}>>,
    |   <<3, {1}>>,
    |   <<3, {2}>>,
    |   <<3, {1, 2}>> }
---*)
