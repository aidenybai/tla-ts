(*---
description: Evaluates a random int expression, seed 262, number 2143.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02143 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Len(SelectSeq(<<1, 2>>, LAMBDA e : e > 0)) + ((1 \div 7) \div (-2147483647))) % Len(SortSeq(SelectSeq(<<>>, LAMBDA e : e > 0), LAMBDA p, q : p < q))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02143 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
