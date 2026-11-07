(*---
description: Evaluates a random int expression, seed 262, number 7559.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07559 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Len(<<3, 1, 2>>))[(2147483647 - FALSE)] - ((CHOOSE r \in [a : {2, 1, 3}] : TRUE)).a) :> Cardinality(({0, -1} \ (1 .. 3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07559 failed.
    A non-function (an integer) was applied as a function.
    line 14, col 18 to line 14, col 57 of module random_07559
---*)
