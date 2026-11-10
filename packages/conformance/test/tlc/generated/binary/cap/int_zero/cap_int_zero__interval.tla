(*---
description: cap of int_zero, a IntValue, and interval, a IntervalValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_int_zero__interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((0) \cap (1..3))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module cap_int_zero__interval failed.
    Attempted to check if the value:
    1
    is an element of the integer 0
---*)
