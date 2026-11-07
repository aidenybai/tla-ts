(*---
description: Evaluates a random seq expression, seed 262, number 7412.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07412 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<([a |-> 1, b |-> FALSE]).a, Len(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q))>> \o Tail(Tail([<<>> EXCEPT ![1] = 3]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 110 to line 14, col 113 of module random_07412
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
