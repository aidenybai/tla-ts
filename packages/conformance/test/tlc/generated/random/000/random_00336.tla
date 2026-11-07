(*---
description: Evaluates a random bool expression, seed 262, number 336.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00336 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((IF FALSE THEN 1 ELSE -1 < (2147483647 = -1)) => ((TRUE => FALSE) \/ (~FALSE))) => ([a |-> (1 * FALSE), b |-> (FALSE <=> FALSE)] = [a |-> (<<1>> = [x \in Nat |-> x + 1]), b |-> (\E b565 \in {} : FALSE)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The second argument of < should be an integer, but instead it is:
    FALSE
    2266:0 The second argument of < should be an integer, but instead it is:
    FALSE
---*)
