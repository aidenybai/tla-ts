(*---
description: Evaluates a random bool expression, seed 262, number 5748.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05748 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((-0) * (2147483647 - 2147483647)) * IF (1 < 3) THEN ([x \in Nat |-> x + 1])[0] ELSE (-1 * <<1>>)) = (Cardinality({FALSE : b8849 \in {1, 2}}) - Len([a |-> 7, b |-> TRUE]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Len should be a sequence, but instead it is:
    [a |-> 7, b |-> TRUE]
    2283:0 The argument of Len should be a sequence, but instead it is:
    [a |-> 7, b |-> TRUE]
---*)
