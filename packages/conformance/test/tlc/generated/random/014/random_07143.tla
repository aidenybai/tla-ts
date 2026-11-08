(*---
description: Evaluates a random seq expression, seed 262, number 7143.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07143 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq((SubSeq(SortSeq(<<>>, LAMBDA p, q : p < q), (-1 % 0), (3 \div 1)) \o ((3 * 2) \o SortSeq(<<1>>, LAMBDA p, q : p < q))), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07143 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
