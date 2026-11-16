(*---
description: Evaluates a random function expression, seed 262, number 5612.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05612 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(SortSeq((<<1, 2>> \o <<1, 2>>), LAMBDA p, q : p < q)) :> ((Cardinality({2, 1, 3}) \in {3 : b8686 \in SUBSET {1}}))[(Cardinality({1, 2}) \div Head(<<1>>))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05612 failed.
    A non-function (a Boolean value) was applied as a function.
    line 14, col 79 to line 14, col 175 of module random_05612
---*)
