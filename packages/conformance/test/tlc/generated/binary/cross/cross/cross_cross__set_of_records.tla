(*---
description: cross of cross, a SetOfTuplesValue, and set_of_records, a SetOfRcdsValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_cross__set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \X {3}) \X ([a : {1, 2}]))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { <<<<1, 3>>, [a |-> 1]>>,
    |   <<<<1, 3>>, [a |-> 2]>>,
    |   <<<<2, 3>>, [a |-> 1]>>,
    |   <<<<2, 3>>, [a |-> 2]>> }
---*)
