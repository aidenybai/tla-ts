(*---
description: Evaluates a random set expression, seed 262, number 5723.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05723 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([SelectSeq(SelectSeq(<<>>, LAMBDA e : e > 0), LAMBDA e : e > 0) EXCEPT ![1] = ((<<5, 6>> @@ [x \in 1..2 |-> x]))[(2 % 2147483647)]] \o Tail(SelectSeq(SortSeq(<<>>, LAMBDA p, q : p < q), LAMBDA e : e > 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 18 to line 14, col 79 of module random_05723
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
