(*---
description: Evaluates a random bool expression, seed 262, number 9209.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09209 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality((UNION {SUBSET {1}, 1..3} \cap DOMAIN [x \in Nat |-> x + 1])) \in {IF (~[a |-> 1, b |-> TRUE]) THEN Head(<<>>) ELSE LET b14295 == 7 IN 0, (-(-1 - 3))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    {}
    is an element of Nat.
    2158:0 Attempted to check if the value:
    {}
    is an element of Nat.
---*)
