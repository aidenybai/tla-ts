(*---
description: cross of set_of_records, a SetOfRcdsValue, and set_of_functions, a SetOfFcnsValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_set_of_records__set_of_functions ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a : {1, 2}]) \X ([{1} -> {2, 3}]))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { <<[a |-> 1], <<2>>>>,
    |   <<[a |-> 1], <<3>>>>,
    |   <<[a |-> 2], <<2>>>>,
    |   <<[a |-> 2], <<3>>>> }
---*)
