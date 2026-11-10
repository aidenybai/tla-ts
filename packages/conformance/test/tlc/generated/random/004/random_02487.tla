(*---
description: Evaluates a random seq expression, seed 262, number 2487.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02487 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(SubSeq(<<(<<5, 6>>)[3], Head(<<1, 2>>)>>, ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2147483647]).a, ([b3912 \in {1} |-> b3912])[LET b3913 == [x \in 1..2 |-> x] IN 2]), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02487 failed.
    Attempted to access index 3 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
