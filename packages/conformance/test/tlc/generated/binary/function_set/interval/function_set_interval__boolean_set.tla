(*---
description: function_set of interval, a IntervalValue, and boolean_set, a SetEnumValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_interval__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(1..3) -> (BOOLEAN)])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { <<FALSE, FALSE, FALSE>>,
    |   <<FALSE, FALSE, TRUE>>,
    |   <<FALSE, TRUE, FALSE>>,
    |   <<FALSE, TRUE, TRUE>>,
    |   <<TRUE, FALSE, FALSE>>,
    |   <<TRUE, FALSE, TRUE>>,
    |   <<TRUE, TRUE, FALSE>>,
    |   <<TRUE, TRUE, TRUE>> }
---*)
