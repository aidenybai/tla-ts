(*---
description: Evaluates a random seq expression, seed 262, number 2447.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02447 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Tail(SortSeq(SubSeq(<<>>, 3, 0), LAMBDA p, q : p < q)), (Head(Append(<<1, 2>>, 2)) - ((2147483647 * 1) + LET b3860 == 0 IN b3860))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
