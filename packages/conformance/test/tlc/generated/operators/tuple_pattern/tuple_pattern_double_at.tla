(*---
description: tuple_pattern applied to double_at, a FcnRcdValue.
ref: tlc2/util/Context.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE tuple_pattern_double_at ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({a : <<a, b>> \in (1 :> 2) @@ (2 :> 3)})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module tuple_pattern_double_at failed.
    TLC encountered a non-enumerable quantifier bound
    <<2, 3>>.
    line 14, col 34 to line 14, col 53 of module tuple_pattern_double_at
---*)
