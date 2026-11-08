(*---
description: Evaluates a random bool expression, seed 262, number 6823.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06823 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(SelectSeq(<<[x \in 1..2 |-> x], 3>>, LAMBDA e : e > 0)) \in {Cardinality(({2, 1, 3} \ {})), ((-2147483647) \div (7 % 7))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06823 failed.
    2266:0 The first argument of > should be an integer, but instead it is:
    <<1, 2>>
---*)
