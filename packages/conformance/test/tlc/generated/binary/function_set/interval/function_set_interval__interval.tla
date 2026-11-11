(*---
description: function_set of interval, a IntervalValue, and interval, a IntervalValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_interval__interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(1..3) -> (1..3)])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { <<1, 1, 1>>,
    |   <<1, 1, 2>>,
    |   <<1, 1, 3>>,
    |   <<1, 2, 1>>,
    |   <<1, 2, 2>>,
    |   <<1, 2, 3>>,
    |   <<1, 3, 1>>,
    |   <<1, 3, 2>>,
    |   <<1, 3, 3>>,
    |   <<2, 1, 1>>,
    |   <<2, 1, 2>>,
    |   <<2, 1, 3>>,
    |   <<2, 2, 1>>,
    |   <<2, 2, 2>>,
    |   <<2, 2, 3>>,
    |   <<2, 3, 1>>,
    |   <<2, 3, 2>>,
    |   <<2, 3, 3>>,
    |   <<3, 1, 1>>,
    |   <<3, 1, 2>>,
    |   <<3, 1, 3>>,
    |   <<3, 2, 1>>,
    |   <<3, 2, 2>>,
    |   <<3, 2, 3>>,
    |   <<3, 3, 1>>,
    |   <<3, 3, 2>>,
    |   <<3, 3, 3>> }
---*)
