(*---
description: Evaluates a random int expression, seed 262, number 6422.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06422 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Tail(Tail(SortSeq(<<>>, LAMBDA p, q : p < q))) \o SelectSeq(SelectSeq(SortSeq(<<1>>, LAMBDA p, q : p < q), LAMBDA e : e > 0), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
