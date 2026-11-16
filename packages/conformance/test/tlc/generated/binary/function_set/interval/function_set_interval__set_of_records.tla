(*---
description: function_set of interval, a IntervalValue, and set_of_records, a SetOfRcdsValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_interval__set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(1..3) -> ([a : {1, 2}])])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { <<[a |-> 1], [a |-> 1], [a |-> 1]>>,
    |   <<[a |-> 1], [a |-> 1], [a |-> 2]>>,
    |   <<[a |-> 1], [a |-> 2], [a |-> 1]>>,
    |   <<[a |-> 1], [a |-> 2], [a |-> 2]>>,
    |   <<[a |-> 2], [a |-> 1], [a |-> 1]>>,
    |   <<[a |-> 2], [a |-> 1], [a |-> 2]>>,
    |   <<[a |-> 2], [a |-> 2], [a |-> 1]>>,
    |   <<[a |-> 2], [a |-> 2], [a |-> 2]>> }
---*)
