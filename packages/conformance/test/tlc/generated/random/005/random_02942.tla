(*---
description: Evaluates a random bool expression, seed 262, number 2942.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02942 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Tail([Tail(<<>>) EXCEPT ![1] = ([a |-> 1]).a]) = [b4661 \in (DOMAIN [x \in 1..2 |-> x] \ (0 .. 1)) |-> (CASE TRUE -> 2147483647 [] OTHER -> b4661 * (CHOOSE f \in [1..2 -> 1..2] : TRUE))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
