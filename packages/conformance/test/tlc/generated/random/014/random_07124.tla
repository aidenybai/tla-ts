(*---
description: Evaluates a random set expression, seed 262, number 7124.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07124 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Tail(Tail(SortSeq({1, 2}, LAMBDA p, q : p < q))), (CHOOSE b10938 \in (([a |-> 1, b |-> TRUE] \cup {x \in 1..3 : x > 1}) \cup {b10939 : b10939 \in 2..1}) : ((-b10938) \in DOMAIN [x \in Nat |-> x + 1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    {1, 2}
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    {1, 2}
---*)
