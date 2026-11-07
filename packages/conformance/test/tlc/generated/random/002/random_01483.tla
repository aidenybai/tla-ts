(*---
description: Evaluates a random set expression, seed 262, number 1483.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01483 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({Head(<<1, 2>>), Cardinality([a |-> 1, b |-> TRUE])} \ (UNION {{1, 2}, 2..1} \cup {b2372 \in 1..3 : TRUE})) \cap DOMAIN [b2373 \in DOMAIN <<5, 6>> |-> ([a |-> 1, b |-> TRUE]).a]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    [a |-> 1, b |-> TRUE]
    2181:0 Attempted to compute cardinality of the value
    [a |-> 1, b |-> TRUE]
---*)
