(*---
description: cross of set_of_records, a SetOfRcdsValue, and cross, a SetOfTuplesValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_set_of_records__cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a : {1, 2}]) \X ({1, 2} \X {3}))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { <<[a |-> 1], <<1, 3>>>>,
    |   <<[a |-> 1], <<2, 3>>>>,
    |   <<[a |-> 2], <<1, 3>>>>,
    |   <<[a |-> 2], <<2, 3>>>> }
---*)
