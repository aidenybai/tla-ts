(*---
description: Evaluates a random seq expression, seed 262, number 6133.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06133 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Tail(SortSeq(Tail(<<1>>), LAMBDA p, q : p < q)), Len(Append(SubSeq(<<>>, 1, 1), (-2147483647)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06133 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
