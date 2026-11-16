(*---
description: tuple_pattern applied to model_value, a ModelValue.
ref: tlc2/util/Context.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
config: |
  CONSTANT mv = mv
---*)
---- MODULE tuple_pattern_model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT({a : <<a, b>> \in mv})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 18, col 8 to line 18, col 11 of module tuple_pattern_model_value failed.
    TLC encountered a non-enumerable quantifier bound
    mv.
    line 17, col 34 to line 17, col 35 of module tuple_pattern_model_value
---*)
