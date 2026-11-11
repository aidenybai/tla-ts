(*---
description: cross of subset, a SubsetValue, and set_of_functions, a SetOfFcnsValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_subset__set_of_functions ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SUBSET {1, 2}) \X ([{1} -> {2, 3}]))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { <<{}, <<2>>>>,
    |   <<{}, <<3>>>>,
    |   <<{1}, <<2>>>>,
    |   <<{1}, <<3>>>>,
    |   <<{2}, <<2>>>>,
    |   <<{2}, <<3>>>>,
    |   <<{1, 2}, <<2>>>>,
    |   <<{1, 2}, <<3>>>> }
---*)
