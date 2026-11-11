(*---
description: Evaluates a random int expression, seed 262, number 9922.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09922 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(Tail((SortSeq(<<1>>, LAMBDA p, q : p < q) \o Tail(<<>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09922 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
