(*---
description: Evaluates a random bool expression, seed 262, number 9553.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09553 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality((DOMAIN <<5, 6>> \cap {b14839 \in <<3, 1, 2>> : TRUE})) = IF (([a |-> 1, b |-> TRUE] = [a |-> 1]) /\ (-1 < 0)) THEN Tail(Tail(<<>>)) ELSE Head([<<1, 2>> EXCEPT ![1] = 7])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09553 failed.
    Attempted to check set membership in a tuple value.
---*)
