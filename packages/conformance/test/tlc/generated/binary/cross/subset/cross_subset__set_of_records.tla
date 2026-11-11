(*---
description: cross of subset, a SubsetValue, and set_of_records, a SetOfRcdsValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_subset__set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SUBSET {1, 2}) \X ([a : {1, 2}]))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { <<{}, [a |-> 1]>>,
    |   <<{}, [a |-> 2]>>,
    |   <<{1}, [a |-> 1]>>,
    |   <<{1}, [a |-> 2]>>,
    |   <<{2}, [a |-> 1]>>,
    |   <<{2}, [a |-> 2]>>,
    |   <<{1, 2}, [a |-> 1]>>,
    |   <<{1, 2}, [a |-> 2]>> }
---*)
