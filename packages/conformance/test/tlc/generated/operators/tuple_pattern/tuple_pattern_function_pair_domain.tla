(*---
description: tuple_pattern applied to function_pair_domain, a FcnRcdValue.
ref: tlc2/util/Context.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE tuple_pattern_function_pair_domain ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({a : <<a, b>> \in [x \in {1}, y \in {2} |-> x + y]})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module tuple_pattern_function_pair_domain failed.
    TLC encountered a non-enumerable quantifier bound
    (<<1, 2>> :> 3).
    line 14, col 34 to line 14, col 65 of module tuple_pattern_function_pair_domain
---*)
