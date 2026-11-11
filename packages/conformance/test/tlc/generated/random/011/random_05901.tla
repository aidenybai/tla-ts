(*---
description: Evaluates a random seq expression, seed 262, number 5901.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05901 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(SortSeq(SubSeq(Tail(<<3, 1, 2>>), (2147483647).a, (0 - 3)), LAMBDA p, q : p < q), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05901 failed.
    Attempted to select field "a" from a non-record value 2147483647
    line 14, col 58 to line 14, col 71 of module random_05901
---*)
