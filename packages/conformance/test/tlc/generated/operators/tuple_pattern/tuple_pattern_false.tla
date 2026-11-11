(*---
description: tuple_pattern applied to false, a BoolValue.
ref: tlc2/util/Context.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE tuple_pattern_false ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({a : <<a, b>> \in FALSE})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module tuple_pattern_false failed.
    TLC encountered a non-enumerable quantifier bound
    FALSE.
    line 14, col 34 to line 14, col 38 of module tuple_pattern_false
---*)
