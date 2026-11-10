(*---
description: Evaluates a random bool expression, seed 262, number 116.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00116 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({(-1 - 2), Len(<<>>)} = (-(-1 + 3))) => (~({2147483647 : b175 \in {1, 2}} \subseteq {b176 \in 1..3 : TRUE}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00116 failed.
    Attempted to check equality of the set {-3, 0} with the value:
    -2
---*)
