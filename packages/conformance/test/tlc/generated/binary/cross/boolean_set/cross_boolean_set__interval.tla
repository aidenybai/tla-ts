(*---
description: cross of boolean_set, a SetEnumValue, and interval, a IntervalValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_boolean_set__interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((BOOLEAN) \X (1..3))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { <<FALSE, 1>>,
    |   <<FALSE, 2>>,
    |   <<FALSE, 3>>,
    |   <<TRUE, 1>>,
    |   <<TRUE, 2>>,
    |   <<TRUE, 3>> }
---*)
