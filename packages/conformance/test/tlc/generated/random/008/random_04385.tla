(*---
description: Evaluates a random bool expression, seed 262, number 4385.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04385 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((IF (\E b6900 \in {x \in 1..3 : x > 1} : FALSE) THEN (2147483647 * 1) ELSE (2147483647 % 1) = IF (<<1>> = [x \in Nat |-> x + 1]) THEN Head(<<1, 2>>) ELSE LET b6901 == 1 IN b6901) <=> (({7, 7} \cap (0 .. <<3, 1, 2>>)) \/ (~(TRUE /\ TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04385 failed.
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
