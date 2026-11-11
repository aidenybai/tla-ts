(*---
description: cap of int_negative, a IntValue, and set_filter, a SetPredValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_int_negative__set_filter ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-3) \cap ({x \in 1..3 : x > 1}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module cap_int_negative__set_filter failed.
    Attempted to check if the value:
    2
    is an element of the integer -3
---*)
