(*---
description: cross of set_of_records, a SetOfRcdsValue, and interval, a IntervalValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_set_of_records__interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a : {1, 2}]) \X (1..3))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { <<[a |-> 1], 1>>,
    |   <<[a |-> 1], 2>>,
    |   <<[a |-> 1], 3>>,
    |   <<[a |-> 2], 1>>,
    |   <<[a |-> 2], 2>>,
    |   <<[a |-> 2], 3>> }
---*)
