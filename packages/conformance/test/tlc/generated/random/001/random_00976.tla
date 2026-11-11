(*---
description: Evaluates a random seq expression, seed 262, number 976.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00976 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(Tail(((0 % 2147483647) * Head(<<1>>))), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00976 failed.
    2283:0 The argument of Tail should be a sequence, but instead it is:
    0
---*)
