(*---
description: Evaluates a random int expression, seed 262, number 2994.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02994 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b4755 \in UNION {({2147483647, 7} \cup ({2, 1, 3} \ (1 :> 2))), {b4756 \in UNION {Nat, {}} : ([a |-> 1, b |-> TRUE] = TRUE)}} : (~(({x \in 1..3 : x > 1} \cup 1..3) \subseteq DOMAIN [x \in Nat |-> x + 1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02994 failed.
    Attempted to check if the value:
    2
    is an element of the function <<2>>
---*)
