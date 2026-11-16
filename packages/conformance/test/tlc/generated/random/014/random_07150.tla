(*---
description: Evaluates a random seq expression, seed 262, number 7150.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07150 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq((\E b10986 \in UNION {{2147483647, 1}, {b10987 : b10987 \in {x \in 1..3 : x > 1}}} : ((Nat \subseteq {1, 2}) \/ (\A b10988 \in {2, 1, 3} : FALSE))), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07150 failed.
    Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 14, col 111 to line 14, col 130 of module random_07150
---*)
