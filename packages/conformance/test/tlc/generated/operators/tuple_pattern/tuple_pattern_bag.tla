(*---
description: tuple_pattern applied to bag, a FcnRcdValue.
ref: tlc2/util/Context.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE tuple_pattern_bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({a : <<a, b>> \in SetToBag({1})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module tuple_pattern_bag failed.
    TLC encountered a non-enumerable quantifier bound
    <<1>>.
    line 14, col 34 to line 14, col 46 of module tuple_pattern_bag
---*)
