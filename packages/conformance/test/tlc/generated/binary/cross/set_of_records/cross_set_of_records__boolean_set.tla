(*---
description: cross of set_of_records, a SetOfRcdsValue, and boolean_set, a SetEnumValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_set_of_records__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a : {1, 2}]) \X (BOOLEAN))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { <<[a |-> 1], FALSE>>,
    |   <<[a |-> 1], TRUE>>,
    |   <<[a |-> 2], FALSE>>,
    |   <<[a |-> 2], TRUE>> }
---*)
