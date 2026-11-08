(*---
description: Evaluates a random int expression, seed 262, number 8244.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08244 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE (~(\E b12756 \in {1} : TRUE)) -> ((CHOOSE f \in [{1} -> {1, 2}] : TRUE))[(-2)] [] OTHER -> LET b12757 == Len(<<>>) IN IF FALSE THEN -1 ELSE 7 % (-LET b12758 == Cardinality({1, 2}) IN (b12758 + b12758))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08244 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    -4
---*)
