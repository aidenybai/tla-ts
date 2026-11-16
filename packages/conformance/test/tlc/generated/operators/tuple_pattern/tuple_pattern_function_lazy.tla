(*---
description: tuple_pattern applied to function_lazy, a FcnLambdaValue.
ref: tlc2/util/Context.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE tuple_pattern_function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({a : <<a, b>> \in [x \in Nat |-> x]})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module tuple_pattern_function_lazy failed.
    TLC encountered a non-enumerable quantifier bound
    [x \in Nat |-> <expression line 14, col 49 to line 14, col 49 of module tuple_pattern_function_lazy>].
    line 14, col 34 to line 14, col 50 of module tuple_pattern_function_lazy
---*)
