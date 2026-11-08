(*---
description: Evaluates a random seq expression, seed 262, number 7667.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07667 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(SubSeq((SubSeq(<<1>>, 2, 1) \o SortSeq(<<>>, LAMBDA p, q : p < q)), Cardinality({2147483647, 7}), (([a |-> 1, b |-> TRUE]).a % (2 + 7)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07667 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
