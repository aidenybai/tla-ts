(*---
description: Evaluates a random int expression, seed 262, number 9879.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09879 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(SelectSeq(Append(<<1, 2>>, 2147483647), LAMBDA e : e > 0)) \div IF (\E b15354 \in (Nat \cap 1..3) : (1..3 = 2)) THEN (LET b15355 == 0 IN 2 % (<<5, 6>>)[3]) ELSE ((3 \div 0) + (-1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09879 failed.
    Attempted to check equality of the set {1, 2, 3} with the value:
    2
---*)
