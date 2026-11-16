(*---
description: Evaluates a random function expression, seed 262, number 5120.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05120 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE f \in [2..1 -> 2..1] : TRUE))[LET b7962 == (2147483647 % -1) IN Head(<<3, 1, 2>>)] :> (-(Head(<<3, 1, 2>>) \div Cardinality({2, 1, 3})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05120 failed.
    Attempted to apply function:
    <<>>
    to argument 3, which is not in the domain of the function.
---*)
