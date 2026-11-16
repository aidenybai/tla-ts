(*---
description: function_set of interval, a IntervalValue, and union, a UnionValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_interval__union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(1..3) -> (UNION {{1}, {2}})])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { <<1, 1, 1>>,
    |   <<1, 1, 2>>,
    |   <<1, 2, 1>>,
    |   <<1, 2, 2>>,
    |   <<2, 1, 1>>,
    |   <<2, 1, 2>>,
    |   <<2, 2, 1>>,
    |   <<2, 2, 2>> }
---*)
