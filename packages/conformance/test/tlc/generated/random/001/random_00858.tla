(*---
description: Evaluates a random set expression, seed 262, number 858.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00858 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Len(<<(2 + 1), Head(FALSE)>>), (-SortSeq(Tail(<<1, 2>>), LAMBDA p, q : p < q))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00858 failed.
    2283:0 The argument of Head should be a sequence, but instead it is:
    FALSE
---*)
