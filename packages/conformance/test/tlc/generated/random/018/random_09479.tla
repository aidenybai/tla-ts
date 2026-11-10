(*---
description: Evaluates a random seq expression, seed 262, number 9479.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09479 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(SortSeq(Tail(Tail(<<1>>)), LAMBDA p, q : p < q), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09479 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
