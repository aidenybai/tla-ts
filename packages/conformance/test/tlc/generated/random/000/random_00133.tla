(*---
description: Evaluates a random set expression, seed 262, number 133.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00133 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN [b208 \in {7, 3} |-> LET b209 == [a |-> 1, b |-> TRUE] IN FALSE] \cap IF (Cardinality(2..1) < (-7)) THEN Cardinality(({1} \ SUBSET {1})) ELSE Head(Tail(<<>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
