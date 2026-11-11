(*---
description: tuple_pattern applied to colon_greater, a FcnRcdValue.
ref: tlc2/util/Context.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE tuple_pattern_colon_greater ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({a : <<a, b>> \in 1 :> 2})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module tuple_pattern_colon_greater failed.
    TLC encountered a non-enumerable quantifier bound
    <<2>>.
    line 14, col 34 to line 14, col 39 of module tuple_pattern_colon_greater
---*)
