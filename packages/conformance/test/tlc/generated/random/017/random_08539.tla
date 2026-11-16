(*---
description: Evaluates a random bool expression, seed 262, number 8539.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08539 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b13233 \in Tail([SubSeq(<<3, 1, 2>>, 2147483647, 2) EXCEPT ![1] = ([x \in Nat |-> x + 1])[1]]) : ([a |-> LET b13234 == [x \in 1..2 |-> x] IN b13233, b |-> ([a |-> 1, b |-> TRUE] = <<1>>)] = (CHOOSE r \in [a : {2, 1, 3}] : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 37 to line 14, col 70 of module random_08539
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08539 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
