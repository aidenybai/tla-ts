(*---
description: Asks whether function_strings is in set_filter, a SetPredValue.
ref: tlc2/value/impl/SetPredValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_set_filter__function_strings ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {"a", "b"} |-> x]) \in ({x \in 1..3 : x > 1}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module in_set_filter__function_strings failed.
    Attempted to compare the function [a |-> "a", b |-> "b"] with the value:
    3
---*)
