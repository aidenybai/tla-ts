(*---
description: Evaluates a random bool expression, seed 262, number 9272.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09272 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((DOMAIN [x \in Nat |-> x + 1] \ {b14391 : b14391 \in 1..3}) \ ({b14392 : b14392 \in {2, 1, 3}} \cap {b14393 \in {x \in 1..3 : x > 1} : FALSE})) \subseteq {LET b14394 == (CHOOSE b14395 \in Nat : FALSE) IN ([x \in 1..2 |-> x])[[x \in Nat |-> x + 1]], (-([a |-> 1, b |-> TRUE]).a)}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09272 failed.
    Attempted to check if the value:
    [x \in Nat |-> <expression line 14, col 258 to line 14, col 262 of module random_09272>]
    is in the integer interval 1..2
---*)
