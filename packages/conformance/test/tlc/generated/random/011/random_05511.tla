(*---
description: Evaluates a random bool expression, seed 262, number 5511.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05511 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([a |-> (\E b8515 \in 1..3 : FALSE), b |-> (FALSE \/ TRUE)] = [a |-> IF TRUE THEN -1 ELSE 0, b |-> (3 = 2147483647)]) /\ (Len(<<2, 2147483647>>) \in {Head(<<1>>), (3 + 1)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05511 failed.
    Attempted to compare equality of boolean FALSE with non-boolean:
    -1
---*)
