(*---
description: Evaluates a random seq expression, seed 262, number 8434.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08434 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SortSeq(Append(Tail(<<>>), SelectSeq(<<1, 2>>, LAMBDA e : e > 0)), LAMBDA p, q : p < q) \o SubSeq(Tail(SortSeq(<<1, 2>>, LAMBDA p, q : p < q)), ((0 \div 2) * (-2)), Head(Append(<<1, 2>>, 2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08434 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
