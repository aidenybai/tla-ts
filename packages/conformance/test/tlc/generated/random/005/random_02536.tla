(*---
description: Evaluates a random seq expression, seed 262, number 2536.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02536 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SelectSeq(SubSeq(Tail(<<>>), (-2), Head(<<>>)), LAMBDA e : e > 0) \o (Tail([<<1, 2>> EXCEPT ![1] = 0]) \o [Tail(<<1, 2>>) EXCEPT ![1] = (FALSE % 2147483647)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02536 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
