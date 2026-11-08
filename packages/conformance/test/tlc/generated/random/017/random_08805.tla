(*---
description: Evaluates a random bool expression, seed 262, number 8805.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08805 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b13642 \in DOMAIN [Tail(<<>>) EXCEPT ![1] = (2 - 2)] : ((CHOOSE r \in [a : {2, 1, 3}] : TRUE) = [a |-> CASE FALSE -> 2147483647 [] OTHER -> 1, b |-> (<<3, 1, 2>> = [x \in 1..2 |-> x])])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08805 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
