(*---
description: Evaluates a random bool expression, seed 262, number 270.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00270 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((\A b456 \in UNION {DOMAIN [x \in Nat |-> x + 1], {3, 2147483647}} : (\E b457 \in DOMAIN (1 :> 2) : (TRUE = [x \in 1..2 |-> x]))) <=> ((([a |-> 1, b |-> TRUE]).a - ([a |-> 1]).a) < Head([<<1>> EXCEPT ![1] = 3]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00270 failed.
    Attempted to compare the set {3, 2147483647} with the value:
    Nat
---*)
