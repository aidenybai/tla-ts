(*---
description: tuple_pattern applied to set_filter, a SetPredValue.
ref: tlc2/util/Context.java
features:
  - value-matrix
  - tlc-bug
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE tuple_pattern_set_filter ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({a : <<a, b>> \in {x \in 1..3 : x > 1}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 16, col 8 to line 16, col 11 of module tuple_pattern_set_filter failed.
    2170:0 Argument mismatch in operator application.%1
---*)
