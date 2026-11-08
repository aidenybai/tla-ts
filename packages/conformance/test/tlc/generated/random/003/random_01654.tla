(*---
description: Evaluates a random seq expression, seed 262, number 1654.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01654 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(Tail(SortSeq(<<>>, LAMBDA p, q : p < q)) \o (<<2147483647, 7>> \o SubSeq(<<>>, 2147483647, -1))) EXCEPT ![1] = Head(SortSeq(Append(<<3, 1, 2>>, <<1, 2>>), LAMBDA p, q : p < q))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01654 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
