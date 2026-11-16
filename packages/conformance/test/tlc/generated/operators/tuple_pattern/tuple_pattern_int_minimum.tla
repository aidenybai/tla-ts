(*---
description: tuple_pattern applied to int_minimum, a IntValue.
ref: tlc2/util/Context.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE tuple_pattern_int_minimum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({a : <<a, b>> \in (-2147483647 - 1)})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module tuple_pattern_int_minimum failed.
    TLC encountered a non-enumerable quantifier bound
    -2147483648.
    line 14, col 35 to line 14, col 49 of module tuple_pattern_int_minimum
---*)
