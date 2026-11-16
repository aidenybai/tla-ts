(*---
description: tuple_pattern applied to function_strings, a FcnRcdValue.
ref: tlc2/util/Context.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE tuple_pattern_function_strings ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({a : <<a, b>> \in [x \in {"a", "b"} |-> x]})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module tuple_pattern_function_strings failed.
    TLC encountered a non-enumerable quantifier bound
    [a |-> "a", b |-> "b"].
    line 14, col 34 to line 14, col 57 of module tuple_pattern_function_strings
---*)
