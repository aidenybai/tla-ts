(*---
description: Evaluates a random int expression, seed 262, number 1361.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01361 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality({(<<5, 6>>)[b2167] : b2167 \in {2 : b2168 \in [x \in 1..2 |-> x]}}) * Cardinality((({1, 2} \ {1, 2}) \cap (Nat \cap {x \in 1..3 : x > 1})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01361 failed.
    TLC encountered a non-enumerable quantifier bound
    <<1, 2>>.
    line 14, col 75 to line 14, col 92 of module random_01361
---*)
