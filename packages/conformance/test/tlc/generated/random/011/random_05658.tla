(*---
description: Evaluates a random bool expression, seed 262, number 5658.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05658 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((({1, 2} @@ [x \in 1..2 |-> x]))[(7 % 2147483647)] :> Cardinality({2, 0})) = [((-1 :> 2147483647) @@ (CHOOSE f \in [{1, 2} \ {1} -> {0} \cup {1}] : TRUE)) EXCEPT ![((1 :> 1))[(3 \div FALSE)]] = ([[a |-> 1, b |-> TRUE] EXCEPT !.a = -1]).a]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of @@ should be a function, but instead it is:
    {1, 2}
    2169:0 The first argument of @@ should be a function, but instead it is:
    {1, 2}
---*)
