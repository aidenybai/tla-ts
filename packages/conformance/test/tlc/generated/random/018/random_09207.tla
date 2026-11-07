(*---
description: Evaluates a random bool expression, seed 262, number 9207.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09207 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CASE TRUE -> 3 [] OTHER -> 2147483647 :> (1..3 % 1)) @@ (CHOOSE f \in [{2, 1, 3} -> {1, 2} \cap {2}] : TRUE)) <=> [(CHOOSE f \in [2..1 -> {1}] : TRUE) EXCEPT ![((CHOOSE f \in [{1, 2} \ {1} -> {}] : TRUE))[(2147483647 - 2147483647)]] = (CHOOSE b14292 \in (2 .. 2147483647) : (b14292 \in {x \in 1..3 : x > 1}))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of @@ should be a function, but instead it is:
    3
    2169:0 The first argument of @@ should be a function, but instead it is:
    3
---*)
