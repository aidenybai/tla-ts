(*---
description: Evaluates a random bool expression, seed 262, number 3025.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03025 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SubSeq(SelectSeq(Tail(<<3, 1, 2>>), LAMBDA e : e > 0), ([a |-> -1, b |-> TRUE]).a, ((1 + 2147483647) * Len(<<1>>))) = Head([SortSeq(<<1>>, LAMBDA p, q : p < q) EXCEPT ![1] = Len(<<3, 1, 2>>)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03025 failed.
    2178:0 Overflow when computing 1+2147483647
---*)
