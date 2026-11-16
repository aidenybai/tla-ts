(*---
description: cross of interval, a IntervalValue, and set_of_records, a SetOfRcdsValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_interval__set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1..3) \X ([a : {1, 2}]))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { <<1, [a |-> 1]>>,
    |   <<1, [a |-> 2]>>,
    |   <<2, [a |-> 1]>>,
    |   <<2, [a |-> 2]>>,
    |   <<3, [a |-> 1]>>,
    |   <<3, [a |-> 2]>> }
---*)
