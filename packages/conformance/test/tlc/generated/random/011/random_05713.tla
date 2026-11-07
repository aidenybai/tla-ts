(*---
description: Evaluates a random bool expression, seed 262, number 5713.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05713 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((({x \in 1..3 : x > 1} @@ (1 :> 2)))[Cardinality({1, 2})] % ([[a |-> 1] EXCEPT !.a = @ + 0]).a) < ((([x \in Nat |-> x + 1])[2147483647] % (-1 * 0)) + ([[a |-> 1] EXCEPT !.a = 0]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of @@ should be a function, but instead it is:
    {2, 3}
    2169:0 The first argument of @@ should be a function, but instead it is:
    {2, 3}
---*)
