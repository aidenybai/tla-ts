(*---
description: cross of cross, a SetOfTuplesValue, and set_of_functions, a SetOfFcnsValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_cross__set_of_functions ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \X {3}) \X ([{1} -> {2, 3}]))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { <<<<1, 3>>, <<2>>>>,
    |   <<<<1, 3>>, <<3>>>>,
    |   <<<<2, 3>>, <<2>>>>,
    |   <<<<2, 3>>, <<3>>>> }
---*)
