(*---
description: cross of interval, a IntervalValue, and boolean_set, a SetEnumValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_interval__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1..3) \X (BOOLEAN))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { <<1, FALSE>>,
    |   <<1, TRUE>>,
    |   <<2, FALSE>>,
    |   <<2, TRUE>>,
    |   <<3, FALSE>>,
    |   <<3, TRUE>> }
---*)
